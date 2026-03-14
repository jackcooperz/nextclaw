import type { NcpToolCallResult } from "./tool.js";

export interface NcpRoundBuffer {
  appendText(delta: string): void;
  getText(): string;
  appendToolCall(result: NcpToolCallResult): void;
  getToolCalls(): ReadonlyArray<NcpToolCallResult>;
  clear(): void;
}
