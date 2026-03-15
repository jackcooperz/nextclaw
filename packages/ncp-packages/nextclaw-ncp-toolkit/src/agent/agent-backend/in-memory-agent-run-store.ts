import type {
  NcpEndpointEvent,
  NcpMessageAbortPayload,
  NcpRequestEnvelope,
  NcpStreamRequestPayload,
} from "@nextclaw/ncp";
import type { NcpEventType } from "@nextclaw/ncp";
import type { AgentRunStore, RunRecord } from "./agent-backend-types.js";

export class InMemoryAgentRunStore implements AgentRunStore {
  private readonly runs = new Map<string, RunRecord>();

  async createRunRecord(
    event: Extract<NcpEndpointEvent, { type: typeof NcpEventType.RunStarted }>,
    envelope: NcpRequestEnvelope,
  ): Promise<RunRecord> {
    const runId = event.payload.runId?.trim() || `${envelope.sessionId}-${Date.now()}`;
    const record: RunRecord = {
      runId,
      sessionId: envelope.sessionId,
      correlationId: envelope.correlationId,
      requestMessageId: envelope.message.id,
      responseMessageId: event.payload.messageId,
      events: [],
    };
    this.runs.set(runId, record);
    return structuredClone(record);
  }

  async getRunRecord(runId: string): Promise<RunRecord | null> {
    const record = this.runs.get(runId);
    return record ? structuredClone(record) : null;
  }

  async resolveRunRecord(payload: NcpMessageAbortPayload): Promise<RunRecord | null> {
    if (payload.runId) {
      const directMatch = this.runs.get(payload.runId);
      if (directMatch) {
        return structuredClone(directMatch);
      }
    }

    for (const record of this.runs.values()) {
      if (payload.correlationId && record.correlationId === payload.correlationId) {
        return structuredClone(record);
      }

      if (!payload.messageId) {
        continue;
      }

      const matchesRequest = record.requestMessageId === payload.messageId;
      const matchesResponse = record.responseMessageId === payload.messageId;
      if (matchesRequest || matchesResponse) {
        return structuredClone(record);
      }
    }

    return null;
  }

  async appendEvents(runId: string, events: NcpEndpointEvent[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    const record = this.runs.get(runId);
    if (!record) {
      return;
    }

    record.events.push(...events.map((event) => structuredClone(event)));
  }

  async *streamEvents(
    payload: NcpStreamRequestPayload,
    signal: AbortSignal,
  ): AsyncIterable<NcpEndpointEvent> {
    const record = this.runs.get(payload.runId);
    if (!record || record.sessionId !== payload.sessionId) {
      return;
    }

    const fromIndex = normalizeFromEventIndex(payload.fromEventIndex);
    for (const event of record.events.slice(fromIndex)) {
      if (signal.aborted) {
        break;
      }

      yield structuredClone(event);
    }
  }

  async deleteRun(runId: string): Promise<void> {
    this.runs.delete(runId);
  }

  async deleteSessionRuns(sessionId: string): Promise<void> {
    for (const [runId, record] of this.runs.entries()) {
      if (record.sessionId === sessionId) {
        this.runs.delete(runId);
      }
    }
  }
}

function normalizeFromEventIndex(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.trunc(value));
}
