import type {
  NcpEncodeContext,
  NcpEncodeHooks,
  NcpEndpointEvent,
  NcpMessage,
  NcpMessagePart,
  NcpModelChunk,
  NcpStreamEncoder,
} from "@nextclaw/ncp";

export class DefaultNcpStreamEncoder implements NcpStreamEncoder {
  encode = async function* (
    stream: AsyncIterable<NcpModelChunk>,
    context: NcpEncodeContext,
    hooks?: NcpEncodeHooks,
  ): AsyncGenerator<NcpEndpointEvent> {
    const { sessionId, messageId, runId } = context;
    let textStarted = false;
    let textContent = "";
    const parts: NcpMessagePart[] = [];
    let currentToolName = "";

    for await (const chunk of stream) {
      if (chunk.kind === "text-delta") {
        if (!textStarted) {
          textStarted = true;
          yield { type: "message.text-start", payload: { sessionId, messageId } };
        }
        textContent += chunk.delta;
        yield {
          type: "message.text-delta",
          payload: { sessionId, messageId, delta: chunk.delta },
        };
      }

      if (chunk.kind === "reasoning-delta") {
        yield {
          type: "message.reasoning-delta",
          payload: { sessionId, messageId, delta: chunk.delta },
        };
      }

      if (chunk.kind === "tool-call-start") {
        currentToolName = chunk.toolName;
        yield {
          type: "message.tool-call-start",
          payload: { sessionId, toolCallId: chunk.toolCallId, toolName: chunk.toolName },
        };
      }

      if (chunk.kind === "tool-call-args") {
        yield {
          type: "message.tool-call-args",
          payload: { sessionId, toolCallId: chunk.toolCallId, args: chunk.args },
        };
        yield {
          type: "message.tool-call-end",
          payload: { sessionId, toolCallId: chunk.toolCallId },
        };
        if (hooks?.onToolCall) {
          let args: unknown;
          try {
            args = JSON.parse(chunk.args) as unknown;
          } catch {
            args = chunk.args;
          }
          const content = await hooks.onToolCall(chunk.toolCallId, currentToolName, args);
          parts.push({
            type: "tool-invocation",
            toolName: currentToolName,
            toolCallId: chunk.toolCallId,
            state: "result",
            args,
            result: content,
          });
          yield {
            type: "message.tool-call-result",
            payload: { sessionId, toolCallId: chunk.toolCallId, content },
          };
        }
      }

      if (chunk.kind === "finish") {
        if (textStarted) {
          yield { type: "message.text-end", payload: { sessionId, messageId } };
        }
        if (chunk.reason === "stop" || chunk.reason === "length" || chunk.reason === "error") {
          const finalParts: NcpMessagePart[] =
            textContent.length > 0
              ? [{ type: "text", text: textContent }, ...parts]
              : [...parts];
          const message: NcpMessage = {
            id: messageId,
            sessionId,
            role: "assistant",
            status: "final",
            parts: finalParts,
            timestamp: new Date().toISOString(),
          };
          yield {
            type: "message.completed",
            payload: { sessionId, message, correlationId: context.correlationId },
          };
          yield {
            type: "run.finished",
            payload: { sessionId, messageId, runId },
          };
        }
      }
    }
  };
}
