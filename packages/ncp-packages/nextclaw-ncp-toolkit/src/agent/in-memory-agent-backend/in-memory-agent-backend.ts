import {
  type NcpAgentServerEndpoint,
  type NcpAgentConversationStateManager,
  type NcpAgentRunApi,
  type NcpAgentRunSendOptions,
  type NcpAgentRunStreamOptions,
  type NcpAgentStreamProvider,
  type NcpAgentRuntime,
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
import { AgentRunExecutor } from "./agent-run-executor.js";
import { EventPublisher } from "./event-publisher.js";
import { InMemoryRunStore } from "./in-memory-run-store.js";
import { InMemorySessionStore } from "./in-memory-session-store.js";

type RuntimeFactoryParams = {
  sessionId: string;
  stateManager: NcpAgentConversationStateManager;
};

export type DefaultNcpInMemoryAgentBackendConfig = {
  createRuntime(params: RuntimeFactoryParams): NcpAgentRuntime;
  endpointId?: string;
  version?: string;
  metadata?: Record<string, unknown>;
  supportedPartTypes?: NcpEndpointManifest["supportedPartTypes"];
  expectedLatency?: NcpEndpointManifest["expectedLatency"];
};

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

export class DefaultNcpInMemoryAgentBackend
  implements
    NcpAgentServerEndpoint,
    NcpSessionApi,
    NcpAgentStreamProvider,
    NcpAgentRunApi
{
  readonly manifest: NcpEndpointManifest & { endpointKind: "agent" };

  private readonly runStore: InMemoryRunStore;
  private readonly sessionStore: InMemorySessionStore;
  private readonly executor: AgentRunExecutor;
  private readonly publisher: EventPublisher;
  private started = false;

  constructor(config: DefaultNcpInMemoryAgentBackendConfig) {
    this.runStore = new InMemoryRunStore();
    this.sessionStore = new InMemorySessionStore(config.createRuntime);
    this.executor = new AgentRunExecutor(this.runStore, this.sessionStore);
    this.publisher = new EventPublisher();
    this.manifest = {
      endpointKind: "agent",
      endpointId: config.endpointId?.trim() || "ncp-in-memory-agent-backend",
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
    for (const controller of this.runStore.getAllAbortControllers().values()) {
      controller.abort();
    }
    this.runStore.clearAbortControllers();
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
    const session = this.sessionStore.ensureSession(envelope.sessionId);
    for await (const ev of this.executor.executeRun(
      session,
      envelope,
      controller,
    )) {
      this.publisher.publish(ev);
      yield ev;
    }
  }

  async abort(payload: NcpMessageAbortPayload = {}): Promise<void> {
    return this.handleAbort(payload);
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
        : (payloadOrParams as NcpStreamRequestPayload);
    const signal =
      "payload" in payloadOrParams && "signal" in payloadOrParams
        ? payloadOrParams.signal
        : opts?.signal ?? new AbortController().signal;
    yield* this.runStore.streamEvents(payload, signal);
  }

  async listSessions(): Promise<NcpSessionSummary[]> {
    return [...this.sessionStore.listSessions()]
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .map((session) => this.sessionStore.toSessionSummary(session));
  }

  async listSessionMessages(sessionId: string): Promise<NcpMessage[]> {
    const session = this.sessionStore.getSession(sessionId);
    return session ? this.sessionStore.readMessages(session) : [];
  }

  async getSession(sessionId: string): Promise<NcpSessionSummary | null> {
    const session = this.sessionStore.getSession(sessionId);
    return session ? this.sessionStore.toSessionSummary(session) : null;
  }

  async deleteSession(sessionId: string): Promise<void> {
    const session = this.sessionStore.deleteSession(sessionId);
    if (!session) {
      return;
    }
    if (session.activeRunId) {
      this.runStore.abortRun(session.activeRunId);
    }
    this.runStore.deleteRuns(session.runIds);
  }

  private async ensureStarted(): Promise<void> {
    if (!this.started) {
      await this.start();
    }
  }

  private async handleRequest(envelope: NcpRequestEnvelope): Promise<void> {
    const controller = new AbortController();
    const session = this.sessionStore.ensureSession(envelope.sessionId);
    for await (const ev of this.executor.executeRun(
      session,
      envelope,
      controller,
    )) {
      this.publisher.publish(ev);
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
    const runRecord = this.runStore.resolveRunRecord(payload);
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

    this.runStore.abortRun(runRecord.runId);
    this.runStore.appendEvents(runRecord, [abortEvent]);

    const session = this.sessionStore.getSession(runRecord.sessionId);
    if (session) {
      await session.stateManager.dispatch(abortEvent);
      this.sessionStore.clearActiveRun(runRecord.sessionId);
      this.sessionStore.touchSession(runRecord.sessionId, null);
    }

    this.publisher.publish(abortEvent);
  }
}
