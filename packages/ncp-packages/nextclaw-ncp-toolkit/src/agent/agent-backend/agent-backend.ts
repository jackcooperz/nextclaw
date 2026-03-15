import {
  type NcpAgentServerEndpoint,
  type NcpAgentRunApi,
  type NcpAgentRunSendOptions,
  type NcpAgentRunStreamOptions,
  type NcpAgentStreamProvider,
  type NcpEndpointEvent,
  type NcpEndpointManifest,
  type NcpMessage,
  type NcpMessageAbortPayload,
  type NcpRequestEnvelope,
  type NcpSessionApi,
  type NcpSessionSummary,
  type NcpStreamRequestPayload,
  NcpEventType,
} from "@nextclaw/ncp";
import { AgentLiveSessionRegistry } from "./agent-live-session-registry.js";
import { AgentRunExecutor } from "./agent-run-executor.js";
import type {
  AgentRunStore,
  AgentSessionRecord,
  AgentSessionStore,
  CreateRuntimeFn,
  RunControllerRegistry,
} from "./agent-backend-types.js";
import { EventPublisher } from "./event-publisher.js";
import { InMemoryRunControllerRegistry } from "./in-memory-run-controller-registry.js";

const DEFAULT_SUPPORTED_PART_TYPES: NcpEndpointManifest["supportedPartTypes"] = [
  "text",
  "file",
  "source",
  "step-start",
  "reasoning",
  "tool-invocation",
  "card",
  "rich-text",
  "action",
  "extension",
];

export type DefaultNcpAgentBackendConfig = {
  createRuntime: CreateRuntimeFn;
  sessionStore: AgentSessionStore;
  runStore: AgentRunStore;
  controllerRegistry?: RunControllerRegistry;
  endpointId?: string;
  version?: string;
  metadata?: Record<string, unknown>;
  supportedPartTypes?: NcpEndpointManifest["supportedPartTypes"];
  expectedLatency?: NcpEndpointManifest["expectedLatency"];
};

export class DefaultNcpAgentBackend
  implements
    NcpAgentServerEndpoint,
    NcpSessionApi,
    NcpAgentStreamProvider,
    NcpAgentRunApi
{
  readonly manifest: NcpEndpointManifest & { endpointKind: "agent" };

  private readonly sessionStore: AgentSessionStore;
  private readonly runStore: AgentRunStore;
  private readonly controllerRegistry: RunControllerRegistry;
  private readonly sessionRegistry: AgentLiveSessionRegistry;
  private readonly executor: AgentRunExecutor;
  private readonly publisher: EventPublisher;
  private started = false;

  constructor(config: DefaultNcpAgentBackendConfig) {
    this.sessionStore = config.sessionStore;
    this.runStore = config.runStore;
    this.controllerRegistry =
      config.controllerRegistry ?? new InMemoryRunControllerRegistry();
    this.sessionRegistry = new AgentLiveSessionRegistry(
      this.sessionStore,
      config.createRuntime,
    );
    this.executor = new AgentRunExecutor(
      this.runStore,
      this.controllerRegistry,
      async (sessionId) => this.persistSession(sessionId),
    );
    this.publisher = new EventPublisher();
    this.manifest = {
      endpointKind: "agent",
      endpointId: config.endpointId?.trim() || "ncp-agent-backend",
      version: config.version?.trim() || "0.1.0",
      supportsStreaming: true,
      supportsAbort: true,
      supportsProactiveMessages: false,
      supportsRunStream: true,
      supportedPartTypes:
        config.supportedPartTypes ?? DEFAULT_SUPPORTED_PART_TYPES,
      expectedLatency: config.expectedLatency ?? "seconds",
      metadata: config.metadata,
    };
  }

  async start(): Promise<void> {
    if (this.started) {
      return;
    }

    this.started = true;
    this.publisher.publish({ type: NcpEventType.EndpointReady });
  }

  async stop(): Promise<void> {
    if (!this.started) {
      return;
    }

    this.started = false;
    this.controllerRegistry.abortAll();
    this.sessionRegistry.clear();
  }

  async emit(event: NcpEndpointEvent): Promise<void> {
    await this.ensureStarted();

    switch (event.type) {
      case NcpEventType.MessageRequest:
        await this.handleRequest(event.payload);
        return;
      case NcpEventType.MessageStreamRequest:
        await this.replayToSubscribers(event.payload);
        return;
      case NcpEventType.MessageAbort:
        await this.handleAbort(event.payload);
        return;
      default:
        this.publisher.publish(event);
    }
  }

  subscribe(listener: (event: NcpEndpointEvent) => void): () => void {
    return this.publisher.subscribe(listener);
  }

  async *send(
    envelope: NcpRequestEnvelope,
    options?: NcpAgentRunSendOptions,
  ): AsyncIterable<NcpEndpointEvent> {
    await this.ensureStarted();
    const controller = new AbortController();
    if (options?.signal) {
      options.signal.addEventListener("abort", () => controller.abort(), {
        once: true,
      });
    }

    const session = await this.sessionRegistry.ensureSession(envelope.sessionId);
    for await (const event of this.executor.executeRun(session, envelope, controller)) {
      this.publisher.publish(event);
      yield event;
    }
  }

  async abort(payload: NcpMessageAbortPayload = {}): Promise<void> {
    await this.handleAbort(payload);
  }

  async *stream(
    payloadOrParams:
      | NcpStreamRequestPayload
      | { payload: NcpStreamRequestPayload; signal: AbortSignal },
    opts?: NcpAgentRunStreamOptions,
  ): AsyncIterable<NcpEndpointEvent> {
    const payload =
      "payload" in payloadOrParams && "signal" in payloadOrParams
        ? payloadOrParams.payload
        : payloadOrParams;
    const signal =
      "payload" in payloadOrParams && "signal" in payloadOrParams
        ? payloadOrParams.signal
        : opts?.signal ?? new AbortController().signal;

    yield* this.runStore.streamEvents(payload, signal);
  }

  async listSessions(): Promise<NcpSessionSummary[]> {
    const sessions = await this.sessionStore.listSessions();
    return sessions
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .map((session) => toSessionSummary(session));
  }

  async listSessionMessages(sessionId: string): Promise<NcpMessage[]> {
    const session = await this.sessionStore.getSession(sessionId);
    return session ? session.messages.map((message) => structuredClone(message)) : [];
  }

  async getSession(sessionId: string): Promise<NcpSessionSummary | null> {
    const session = await this.sessionStore.getSession(sessionId);
    return session ? toSessionSummary(session) : null;
  }

  async deleteSession(sessionId: string): Promise<void> {
    const liveSession = this.sessionRegistry.deleteSession(sessionId);
    const storedSession = await this.sessionStore.deleteSession(sessionId);
    const activeRunId =
      liveSession?.stateManager.getSnapshot().activeRun?.runId ??
      storedSession?.activeRunId ??
      null;

    if (activeRunId) {
      this.controllerRegistry.abort(activeRunId);
    }

    await this.runStore.deleteSessionRuns(sessionId);
  }

  private async ensureStarted(): Promise<void> {
    if (!this.started) {
      await this.start();
    }
  }

  private async handleRequest(envelope: NcpRequestEnvelope): Promise<void> {
    const session = await this.sessionRegistry.ensureSession(envelope.sessionId);
    const controller = new AbortController();

    for await (const event of this.executor.executeRun(session, envelope, controller)) {
      this.publisher.publish(event);
    }
  }

  private async replayToSubscribers(
    payload: NcpStreamRequestPayload,
  ): Promise<void> {
    const signal = new AbortController().signal;
    for await (const event of this.runStore.streamEvents(payload, signal)) {
      this.publisher.publish(event);
    }
  }

  private async handleAbort(payload: NcpMessageAbortPayload): Promise<void> {
    const runRecord = await this.runStore.resolveRunRecord(payload);
    if (!runRecord) {
      return;
    }

    const abortEvent: NcpEndpointEvent = {
      type: NcpEventType.MessageAbort,
      payload: {
        runId: runRecord.runId,
        correlationId: payload.correlationId ?? runRecord.correlationId,
        messageId: payload.messageId ?? runRecord.responseMessageId,
      },
    };

    this.controllerRegistry.abort(runRecord.runId);
    await this.runStore.appendEvents(runRecord.runId, [abortEvent]);

    const liveSession = this.sessionRegistry.getSession(runRecord.sessionId);
    if (liveSession) {
      await liveSession.stateManager.dispatch(abortEvent);
      await this.persistSession(runRecord.sessionId);
    } else {
      await this.persistStoredAbort(runRecord.sessionId);
    }

    this.publisher.publish(abortEvent);
  }

  private async persistStoredAbort(sessionId: string): Promise<void> {
    const storedSession = await this.sessionStore.getSession(sessionId);
    if (!storedSession) {
      return;
    }

    await this.sessionStore.saveSession({
      ...storedSession,
      activeRunId: null,
      updatedAt: now(),
    });
  }

  private async persistSession(sessionId: string): Promise<void> {
    const session = this.sessionRegistry.getSession(sessionId);
    if (!session) {
      return;
    }

    const snapshot = session.stateManager.getSnapshot();
    await this.sessionStore.saveSession({
      sessionId,
      messages: readMessages(snapshot),
      activeRunId: snapshot.activeRun?.runId ?? null,
      updatedAt: now(),
    });
  }
}

function readMessages(
  snapshot: {
    messages: ReadonlyArray<NcpMessage>;
    streamingMessage: NcpMessage | null;
  },
): NcpMessage[] {
  const messages = snapshot.messages.map((message) => structuredClone(message));
  if (snapshot.streamingMessage) {
    messages.push(structuredClone(snapshot.streamingMessage));
  }

  return messages;
}

function toSessionSummary(session: AgentSessionRecord): NcpSessionSummary {
  return {
    sessionId: session.sessionId,
    messageCount: session.messages.length,
    updatedAt: session.updatedAt,
    status: session.activeRunId ? "running" : "idle",
    activeRunId: session.activeRunId ?? undefined,
  };
}

function now(): string {
  return new Date().toISOString();
}
