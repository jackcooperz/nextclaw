import type { NcpEndpointEvent, NcpRequestEnvelope } from "@nextclaw/ncp";
import { NcpEventType } from "@nextclaw/ncp";
import type { RunRecord } from "./in-memory-run-store.js";
import type { InMemoryRunStore } from "./in-memory-run-store.js";
import type { InMemorySessionStore } from "./in-memory-session-store.js";
import type { SessionState } from "./in-memory-session-store.js";

function cloneValue<T>(value: T): T {
  return structuredClone(value);
}

export class AgentRunExecutor {
  constructor(
    private readonly runStore: InMemoryRunStore,
    private readonly sessionStore: InMemorySessionStore,
  ) {}

  async *executeRun(
    session: SessionState,
    envelope: NcpRequestEnvelope,
    controller: AbortController,
  ): AsyncGenerator<NcpEndpointEvent> {
    const pendingEvents: NcpEndpointEvent[] = [
      {
        type: NcpEventType.MessageSent,
        payload: {
          sessionId: envelope.sessionId,
          message: cloneValue(envelope.message),
          metadata: envelope.metadata,
        },
      },
    ];
    let runRecord: RunRecord | null = null;

    yield cloneValue(pendingEvents[0]);

    try {
      for await (const event of session.runtime.run(
        {
          sessionId: envelope.sessionId,
          messages: [envelope.message],
          correlationId: envelope.correlationId,
        },
        { signal: controller.signal },
      )) {
        if (event.type === NcpEventType.RunStarted) {
          runRecord = this.runStore.addRunRecord(
            event as Extract<NcpEndpointEvent, { type: typeof NcpEventType.RunStarted }>,
            envelope,
          );
          this.runStore.registerAbortController(runRecord.runId, controller);
          this.runStore.appendEvents(runRecord, pendingEvents);
          this.sessionStore.addRun(envelope.sessionId, runRecord.runId);
        }

        this.runStore.appendEvents(runRecord, [event]);
        this.sessionStore.touchSession(
          envelope.sessionId,
          runRecord?.runId ?? null,
        );
        yield cloneValue(event);
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        await this.publishFailure(error, envelope, session, runRecord);
        const failed = runRecord?.events.slice(-1) ?? [];
        for (const e of failed) {
          yield cloneValue(e);
        }
      }
    } finally {
      if (runRecord?.runId) {
        this.runStore.abortRun(runRecord.runId);
        if (session.activeRunId === runRecord.runId) {
          this.sessionStore.clearActiveRun(runRecord.sessionId);
        }
      }
      this.sessionStore.touchSession(
        envelope.sessionId,
        session.activeRunId,
      );
    }
  }

  private async publishFailure(
    error: unknown,
    envelope: NcpRequestEnvelope,
    session: SessionState,
    runRecord: RunRecord | null,
  ): Promise<void> {
    const message = error instanceof Error ? error.message : String(error);
    const messageId = runRecord?.responseMessageId;
    const runErrorEvent: NcpEndpointEvent = {
      type: NcpEventType.RunError,
      payload: {
        sessionId: envelope.sessionId,
        messageId,
        runId: runRecord?.runId,
        error: message,
      },
    };

    await session.stateManager.dispatch(runErrorEvent);
    this.runStore.appendEvents(runRecord, [runErrorEvent]);
  }
}
