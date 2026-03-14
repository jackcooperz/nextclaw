import type {
  NcpModel,
  NcpModelChunk,
  NcpModelInput,
  NcpModelGenerateOptions,
} from "@nextclaw/ncp";

function getLastUserContent(messages: NcpModelInput["messages"]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== "user") continue;
    if (typeof m.content === "string") return m.content;
    return m.content.map((p) => (p.type === "text" ? p.text : "")).join("");
  }
  return "";
}

export class EchoNcpModel implements NcpModel {
  generate = async function* (
    input: NcpModelInput,
    options?: NcpModelGenerateOptions,
  ): AsyncGenerator<NcpModelChunk> {
    const text = getLastUserContent(input.messages);
    const signal = options?.signal;
    for (const char of text) {
      if (signal?.aborted) break;
      yield { kind: "text-delta", delta: char };
    }
    yield {
      kind: "finish",
      reason: "stop",
      usage: { inputTokens: 0, outputTokens: text.length },
    };
  };
}
