import type {
  NcpAgentRunInput,
  NcpAgentRunOptions,
  NcpAgentRuntime,
  NcpContextBuilder,
  NcpEncodeContext,
  NcpEndpointEvent,
  NcpModel,
  NcpStreamEncoder,
  NcpToolRegistry,
} from "@nextclaw/ncp";
import { DefaultNcpStreamEncoder } from "./stream-encoder.js";
import { DefaultNcpAgentLoop } from "./loop.js";

function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

export type DefaultNcpAgentRuntimeConfig = {
  contextBuilder: NcpContextBuilder;
  model: NcpModel;
  toolRegistry: NcpToolRegistry;
  streamEncoder?: NcpStreamEncoder;
};

export class DefaultNcpAgentRuntime implements NcpAgentRuntime {
  private readonly contextBuilder: NcpContextBuilder;
  private readonly model: NcpModel;
  private readonly toolRegistry: NcpToolRegistry;
  private readonly streamEncoder: NcpStreamEncoder;
  private readonly loop: DefaultNcpAgentLoop;

  constructor(config: DefaultNcpAgentRuntimeConfig) {
    this.contextBuilder = config.contextBuilder;
    this.model = config.model;
    this.toolRegistry = config.toolRegistry;
    this.streamEncoder = config.streamEncoder ?? new DefaultNcpStreamEncoder();
    this.loop = new DefaultNcpAgentLoop();
  }

  run = async function* (
    this: DefaultNcpAgentRuntime,
    input: NcpAgentRunInput,
    options?: NcpAgentRunOptions,
  ): AsyncGenerator<NcpEndpointEvent> {
    const ctx: NcpEncodeContext = {
      messageId: genId(),
      runId: genId(),
      sessionId: input.kind === "request" ? input.payload.sessionId : input.payload.sessionId,
      correlationId: input.kind === "request" ? input.payload.correlationId : undefined,
    };

    let modelInput = this.contextBuilder.prepare(input, {
      sessionMessages: options?.sessionMessages,
    });
    modelInput = {
      ...modelInput,
      tools: [...this.toolRegistry.getToolDefinitions()],
    };

    yield {
      type: "run.started",
      payload: { sessionId: ctx.sessionId, messageId: ctx.messageId, runId: ctx.runId },
    };
    yield {
      type: "message.accepted",
      payload: { messageId: ctx.messageId, correlationId: ctx.correlationId },
    };

    for await (const event of this.loop.run(
      modelInput,
      this.model,
      this.streamEncoder,
      this.toolRegistry,
      ctx,
      options,
    )) {
      yield event;
    }
  };
}
