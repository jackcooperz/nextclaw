import { describe, expect, it, vi } from "vitest";
import { LiteLLMProvider } from "./litellm_provider.js";
import type { LLMResponse } from "./base.js";

function mockResponse(): LLMResponse {
  return {
    content: "ok",
    toolCalls: [],
    finishReason: "stop",
    usage: {
      prompt_tokens: 1,
      completion_tokens: 1,
      total_tokens: 2
    }
  };
}

describe("LiteLLMProvider custom provider routing prefix", () => {
  it("removes only the first custom provider prefix before upstream call", async () => {
    const provider = new LiteLLMProvider({
      apiKey: "sk-test",
      apiBase: "http://127.0.0.1:9/v1",
      defaultModel: "custom-1/minimax/MiniMax-M2.5",
      providerName: "custom-1"
    });

    const chat = vi.fn().mockResolvedValue(mockResponse());
    (provider as unknown as { client: { chat: typeof chat } }).client = {
      chat
    };

    await provider.chat({
      model: "custom-1/minimax/MiniMax-M2.5",
      messages: [{ role: "user", content: "ping" }]
    });

    const firstCall = chat.mock.calls[0]?.[0] as { model?: string };
    expect(firstCall.model).toBe("minimax/MiniMax-M2.5");
  });
});
