import type { NcpRoundBuffer, NcpToolCallResult } from "@nextclaw/ncp";

export class DefaultNcpRoundBuffer implements NcpRoundBuffer {
  private text = "";
  private readonly toolCalls: NcpToolCallResult[] = [];

  appendText = (delta: string): void => {
    this.text += delta;
  };

  getText = (): string => {
    return this.text;
  };

  appendToolCall = (result: NcpToolCallResult): void => {
    this.toolCalls.push(result);
  };

  getToolCalls = (): ReadonlyArray<NcpToolCallResult> => {
    return [...this.toolCalls];
  };

  clear = (): void => {
    this.text = "";
    this.toolCalls.length = 0;
  };
}
