import type { NcpEndpointEvent, NcpRequestEnvelope } from "@nextclaw/ncp";
import { NcpEventType } from "@nextclaw/ncp";
import type {
  AgentRunStore,
  LiveSessionState,
  RunControllerRegistry,
  RunRecord,
} from "./agent-backend-types.js";

export class AgentRunExecutor {
  constructor(
    private readonly runStore: AgentRunStore,
    private readonly controllerRegistry: RunControllerRegistry,
    private readonly persistSession: (sessionId: string) => Promise<void>,
  ) {}

  async *executeRun(
    session: LiveSessionState,
    envelope: NcpRequestEnvelope,
    controller: AbortController,
  ): AsyncGenerator<NcpEndpointEvent> {
    const pendingEvents: NcpEndpointEvent[] = [
      {
        type: NcpEventType.MessageSent,
        payload: {
          sessionId: envelope.sessionId,
          message: structuredClone(envelope.message),
          metadata: envelope.metadata,
        },
      },
    ];
    let pendingEventsStored = false;
    let runRecord: RunRecord | null = null;

    yield structuredClone(pendingEvents[0]);

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
          runRecord = await this.runStore.createRunRecord(
            event as Extract<NcpEndpointEvent, { type: typeof NcpEventType.RunStarted }>,
            envelope,
          );
          this.controllerRegistry.register(runRecord.runId, controller);
        }

        if (runRecord && !pendingEventsStored) {
          pendingEventsStored = true;
          await this.runStore.appendEvents(runRecord.runId, pendingEvents);
        }

        if (runRecord) {
          await this.runStore.appendEvents(runRecord.runId, [event]);
        }

        await this.persistSession(envelope.sessionId);
        yield structuredClone(event);
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        await this.publishFailure(error, envelope, session, runRecord);
        if (runRecord) {
          const failedEvent = await this.readLastRunEvent(runRecord.runId);
          if (failedEvent) {
            yield structuredClone(failedEvent);
          }
        }
      }
    } finally {
      if (runRecord?.runId) {
        this.controllerRegistry.delete(runRecord.runId);
      }

      await this.persistSession(envelope.sessionId);
    }
  }

  private async publishFailure(
    error: unknown,
    envelope: NcpRequestEnvelope,
    session: LiveSessionState,
    runRecord: RunRecord | null,
  ): Promise<void> {
    const message = error instanceof Error ? error.message : String(error);
    const runErrorEvent: NcpEndpointEvent = {
      type: NcpEventType.RunError,
      payload: {
        sessionId: envelope.sessionId,
        messageId: runRecord?.responseMessageId,
        runId: runRecord?.runId,
        error: message,
      },
    };

    await session.stateManager.dispatch(runErrorEvent);
    if (runRecord) {
      await this.runStore.appendEvents(runRecord.runId, [runErrorEvent]);
    }

    await this.persistSession(envelope.sessionId);
  }

  private async readLastRunEvent(runId: string): Promise<NcpEndpointEvent | null> {
    const record = await this.runStore.getRunRecord(runId);
    return record?.events.at(-1) ?? null;
  }
}
