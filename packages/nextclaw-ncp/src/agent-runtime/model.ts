import type { NcpToolDefinition } from "./tool.js";

export type NcpModelMessage = {
  role: "user" | "assistant" | "system";
  content: string | NcpModelContentPart[];
};

export type NcpModelContentPart =
  | { type: "text"; text: string }
  | { type: "tool-use"; toolCallId: string; toolName: string; result: unknown };

export type NcpModelInput = {
  messages: NcpModelMessage[];
  systemPrompt?: string;
  tools?: NcpToolDefinition[];
};

export type NcpModelChunk =
  | { kind: "text-delta"; delta: string }
  | { kind: "reasoning-delta"; delta: string }
  | { kind: "tool-call-start"; toolCallId: string; toolName: string }
  | { kind: "tool-call-args"; toolCallId: string; args: string }
  | { kind: "finish"; reason: string; usage?: NcpModelUsage };

export type NcpModelUsage = {
  inputTokens: number;
  outputTokens: number;
};

export type NcpModelGenerateOptions = {
  signal?: AbortSignal;
  temperature?: number;
  maxTokens?: number;
};

export interface NcpModel {
  generate(
    input: NcpModelInput,
    options?: NcpModelGenerateOptions,
  ): AsyncIterable<NcpModelChunk>;
}
