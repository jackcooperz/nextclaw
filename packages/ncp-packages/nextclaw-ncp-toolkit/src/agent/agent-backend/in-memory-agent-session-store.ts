import type { AgentSessionRecord, AgentSessionStore } from "./agent-backend-types.js";

export class InMemoryAgentSessionStore implements AgentSessionStore {
  private readonly sessions = new Map<string, AgentSessionRecord>();

  async getSession(sessionId: string): Promise<AgentSessionRecord | null> {
    const session = this.sessions.get(sessionId);
    return session ? structuredClone(session) : null;
  }

  async listSessions(): Promise<AgentSessionRecord[]> {
    return [...this.sessions.values()].map((session) => structuredClone(session));
  }

  async saveSession(session: AgentSessionRecord): Promise<void> {
    this.sessions.set(session.sessionId, structuredClone(session));
  }

  async deleteSession(sessionId: string): Promise<AgentSessionRecord | null> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    this.sessions.delete(sessionId);
    return structuredClone(session);
  }
}
