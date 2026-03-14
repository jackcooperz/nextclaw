import type {
  NcpAgentRunOptions,
  NcpEncodeContext,
  NcpEndpointEvent,
  NcpModel,
  NcpModelInput,
  NcpModelMessage,
  NcpRoundBuffer,
  NcpStreamEncoder,
  NcpToolRegistry,
} from "@nextclaw/ncp";
import { DefaultNcpRoundBuffer } from "./round-buffer.js";

export class DefaultNcpAgentLoop {
  run = async function* (
    modelInput: NcpModelInput,
    model: NcpModel,
    encoder: NcpStreamEncoder,
    toolRegistry: NcpToolRegistry,
    ctx: NcpEncodeContext,
    options?: NcpAgentRunOptions,
  ): AsyncGenerator<NcpEndpointEvent> {
    const roundBuffer: NcpRoundBuffer = new DefaultNcpRoundBuffer();
    const onToolCall = async (
      toolCallId: string,
      toolName: string,
      args: unknown,
    ): Promise<unknown> => {
      const result = await toolRegistry.execute(toolCallId, toolName, args);
      roundBuffer.appendToolCall({ toolCallId, toolName, args, result });
      return result;
    };
    let currentInput = modelInput;

    let done = false;
    while (!done && !options?.signal?.aborted) {
      roundBuffer.clear();

      const stream = model.generate(currentInput, { signal: options?.signal });

      for await (const event of encoder.encode(stream, ctx, { onToolCall })) {
        yield event;
        if (event.type === "run.finished") {
          done = true;
          break;
        }
        if (event.type === "message.text-delta") {
          roundBuffer.appendText(event.payload.delta);
        }
      }

      if (done) break;

      const toolResults = roundBuffer.getToolCalls();
      if (toolResults.length === 0) break;

      const assistantContent: NcpModelMessage["content"] = [];
      const text = roundBuffer.getText();
      if (text.length > 0) {
        assistantContent.push({ type: "text", text });
      }
      for (const tr of toolResults) {
        assistantContent.push({
          type: "tool-use",
          toolCallId: tr.toolCallId,
          toolName: tr.toolName,
          result: tr.result,
        });
      }
      currentInput = {
        ...currentInput,
        messages: [
          ...currentInput.messages,
          { role: "assistant", content: assistantContent },
        ],
      };
    }
  };
}
