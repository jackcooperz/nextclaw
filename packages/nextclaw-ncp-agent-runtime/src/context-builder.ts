import type { NcpMessage } from "@nextclaw/ncp";
import type {
  NcpContextBuilder,
  NcpContextPrepareOptions,
  NcpModelInput,
  NcpModelMessage,
} from "@nextclaw/ncp";
import type { NcpAgentRunInput } from "@nextclaw/ncp";

function messageToModelMessage(msg: NcpMessage): NcpModelMessage {
  const parts = msg.parts || [];
  const texts: string[] = [];
  const contentParts: NcpModelMessage["content"] = [];
  for (const p of parts) {
    if (p.type === "text") {
      texts.push(p.text);
    }
    if (p.type === "tool-invocation" && p.state === "result" && p.result !== undefined) {
      contentParts.push({
        type: "tool-use",
        toolCallId: p.toolCallId ?? "",
        toolName: p.toolName,
        result: p.result,
      });
    }
  }
  const text = texts.join("");
  if (contentParts.length === 0) {
    return { role: msg.role as "user" | "assistant" | "system", content: text };
  }
  if (text.length > 0) {
    contentParts.unshift({ type: "text", text });
  }
  return { role: msg.role as "user" | "assistant" | "system", content: contentParts };
}

export class DefaultNcpContextBuilder implements NcpContextBuilder {
  prepare = (
    input: NcpAgentRunInput,
    options?: NcpContextPrepareOptions,
  ): NcpModelInput => {
    const maxMessages = options?.maxMessages ?? 50;
    const sessionMessages = options?.sessionMessages ?? [];
    const systemPrompt = options?.systemPrompt;

    const modelMessages: NcpModelMessage[] = [];
    if (systemPrompt) {
      modelMessages.push({ role: "system", content: systemPrompt });
    }

    const history = sessionMessages.slice(-maxMessages).map(messageToModelMessage);
    modelMessages.push(...history);

    if (input.kind === "request") {
      modelMessages.push(messageToModelMessage(input.payload.message));
    }

    return {
      messages: modelMessages,
      systemPrompt,
    };
  };
}
