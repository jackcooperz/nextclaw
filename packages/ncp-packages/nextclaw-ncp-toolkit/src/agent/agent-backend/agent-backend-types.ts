import type {
  NcpAgentConversationStateManager,
  NcpAgentRuntime,
  NcpEndpointEvent,
  NcpMessage,
  NcpMessageAbortPayload,
  NcpRequestEnvelope,
  NcpStreamRequestPayload,
} from "@nextclaw/ncp";
import type { NcpEventType } from "@nextclaw/ncp";

export type RuntimeFactoryParams = {
  sessionId: string;
  stateManager: NcpAgentConversationStateManager;
};

export type CreateRuntimeFn = (params: RuntimeFactoryParams) => NcpAgentRuntime;

export type AgentSessionRecord = {
  sessionId: string;
  messages: NcpMessage[];
  activeRunId: string | null;
  updatedAt: string;
};

export type RunRecord = {
  runId: string;
  sessionId: string;
  correlationId?: string;
  requestMessageId?: string;
  responseMessageId?: string;
  events: NcpEndpointEvent[];
};

export type LiveSessionState = {
  sessionId: string;
  runtime: NcpAgentRuntime;
  stateManager: NcpAgentConversationStateManager;
};

export interface AgentSessionStore {
  getSession(sessionId: string): Promise<AgentSessionRecord | null>;
  listSessions(): Promise<AgentSessionRecord[]>;
  saveSession(session: AgentSessionRecord): Promise<void>;
  deleteSession(sessionId: string): Promise<AgentSessionRecord | null>;
}

export interface AgentRunStore {
  createRunRecord(
    event: Extract<NcpEndpointEvent, { type: typeof NcpEventType.RunStarted }>,
    envelope: NcpRequestEnvelope,
  ): Promise<RunRecord>;
  getRunRecord(runId: string): Promise<RunRecord | null>;
  resolveRunRecord(payload: NcpMessageAbortPayload): Promise<RunRecord | null>;
  appendEvents(runId: string, events: NcpEndpointEvent[]): Promise<void>;
  streamEvents(
    payload: NcpStreamRequestPayload,
    signal: AbortSignal,
  ): AsyncIterable<NcpEndpointEvent>;
  deleteRun(runId: string): Promise<void>;
  deleteSessionRuns(sessionId: string): Promise<void>;
}

export interface RunControllerRegistry {
  register(runId: string, controller: AbortController): void;
  abort(runId: string): void;
  delete(runId: string): void;
  abortAll(): void;
}
