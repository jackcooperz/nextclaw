import type {
  NcpAgentConversationStateManager,
  NcpAgentRuntime,
  NcpMessage,
  NcpSessionSummary,
} from "@nextclaw/ncp";
import { DefaultNcpAgentConversationStateManager } from "../agent-conversation-state-manager.js";

function cloneValue<T>(value: T): T {
  return structuredClone(value);
}

function now(): string {
  return new Date().toISOString();
}

export type SessionState = {
  sessionId: string;
  runtime: NcpAgentRuntime;
  stateManager: NcpAgentConversationStateManager;
  activeRunId: string | null;
  updatedAt: string;
  runIds: Set<string>;
};

export type CreateRuntimeFn = (params: {
  sessionId: string;
  stateManager: NcpAgentConversationStateManager;
}) => NcpAgentRuntime;

export class InMemorySessionStore {
  private readonly sessions = new Map<string, SessionState>();
  private readonly createRuntime: CreateRuntimeFn;

  constructor(createRuntime: CreateRuntimeFn) {
    this.createRuntime = createRuntime;
  }

  ensureSession(sessionId: string): SessionState {
    const existing = this.sessions.get(sessionId);
    if (existing) {
      return existing;
    }

    const stateManager = new DefaultNcpAgentConversationStateManager();
    const session: SessionState = {
      sessionId,
      stateManager,
      runtime: this.createRuntime({ sessionId, stateManager }),
      activeRunId: null,
      updatedAt: now(),
      runIds: new Set<string>(),
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId: string): SessionState | null {
    return this.sessions.get(sessionId) ?? null;
  }

  listSessions(): SessionState[] {
    return [...this.sessions.values()];
  }

  addRun(sessionId: string, runId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.runIds.add(runId);
      session.activeRunId = runId;
      session.updatedAt = now();
    }
  }

  clearActiveRun(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.activeRunId = null;
      session.updatedAt = now();
    }
  }

  touchSession(sessionId: string, activeRunId: string | null): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.updatedAt = now();
      session.activeRunId = activeRunId;
    }
  }

  deleteSession(sessionId: string): SessionState | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }
    this.sessions.delete(sessionId);
    return session;
  }

  readMessages(session: SessionState): NcpMessage[] {
    const snapshot = session.stateManager.getSnapshot();
    const output = snapshot.messages.map((message) => cloneValue(message));
    if (snapshot.streamingMessage) {
      output.push(cloneValue(snapshot.streamingMessage));
    }
    return output;
  }

  toSessionSummary(session: SessionState): NcpSessionSummary {
    return {
      sessionId: session.sessionId,
      messageCount: this.readMessages(session).length,
      updatedAt: session.updatedAt,
      status: session.activeRunId ? "running" : "idle",
      activeRunId: session.activeRunId ?? undefined,
    };
  }
}
