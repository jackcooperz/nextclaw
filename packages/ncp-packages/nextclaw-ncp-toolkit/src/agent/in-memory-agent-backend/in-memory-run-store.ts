import type {
  NcpEndpointEvent,
  NcpMessageAbortPayload,
  NcpRequestEnvelope,
  NcpStreamRequestPayload,
} from "@nextclaw/ncp";
import type { NcpEventType } from "@nextclaw/ncp";

export type RunRecord = {
  runId: string;
  sessionId: string;
  correlationId?: string;
  requestMessageId?: string;
  responseMessageId?: string;
  events: NcpEndpointEvent[];
};

function cloneValue<T>(value: T): T {
  return structuredClone(value);
}

function normalizeFromEventIndex(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.trunc(value));
}

export class InMemoryRunStore {
  private readonly runs = new Map<string, RunRecord>();
  private readonly abortControllers = new Map<string, AbortController>();

  addRunRecord(
    event: Extract<NcpEndpointEvent, { type: typeof NcpEventType.RunStarted }>,
    envelope: NcpRequestEnvelope,
  ): RunRecord {
    const runId =
      event.payload.runId?.trim() || `${envelope.sessionId}-${Date.now()}`;
    const record: RunRecord = {
      runId,
      sessionId: envelope.sessionId,
      correlationId: envelope.correlationId,
      requestMessageId: envelope.message.id,
      responseMessageId: event.payload.messageId,
      events: [],
    };
    this.runs.set(runId, record);
    return record;
  }

  getRunRecord(runId: string): RunRecord | null {
    return this.runs.get(runId) ?? null;
  }

  resolveRunRecord(payload: NcpMessageAbortPayload): RunRecord | null {
    if (payload.runId && this.runs.has(payload.runId)) {
      return this.runs.get(payload.runId) ?? null;
    }

    for (const record of this.runs.values()) {
      if (payload.correlationId && record.correlationId === payload.correlationId) {
        return record;
      }
      if (payload.messageId) {
        const matchesRequest = record.requestMessageId === payload.messageId;
        const matchesResponse = record.responseMessageId === payload.messageId;
        if (matchesRequest || matchesResponse) {
          return record;
        }
      }
    }

    return null;
  }

  appendEvents(runRecord: RunRecord | null, events: NcpEndpointEvent[]): void {
    if (!runRecord || events.length === 0) {
      return;
    }
    runRecord.events.push(...events.map((event) => cloneValue(event)));
  }

  registerAbortController(runId: string, controller: AbortController): void {
    this.abortControllers.set(runId, controller);
  }

  abortRun(runId: string): void {
    this.abortControllers.get(runId)?.abort();
    this.abortControllers.delete(runId);
  }

  deleteRun(runId: string): void {
    this.abortControllers.delete(runId);
    this.runs.delete(runId);
  }

  deleteRuns(runIds: Iterable<string>): void {
    for (const runId of runIds) {
      this.deleteRun(runId);
    }
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
      yield cloneValue(event);
    }
  }

  getAllAbortControllers(): Map<string, AbortController> {
    return new Map(this.abortControllers);
  }

  clearAbortControllers(): void {
    this.abortControllers.clear();
  }
}
