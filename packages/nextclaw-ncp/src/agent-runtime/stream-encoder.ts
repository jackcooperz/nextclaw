import type { NcpEndpointEvent } from "../types/events.js";
import type { NcpModelChunk } from "./model.js";

export type NcpEncodeContext = {
  sessionId: string;
  messageId: string;
  runId: string;
  correlationId?: string;
};

export type NcpEncodeHooks = {
  onToolCall?(toolCallId: string, toolName: string, args: unknown): Promise<unknown>;
};

export interface NcpStreamEncoder {
  encode(
    stream: AsyncIterable<NcpModelChunk>,
    context: NcpEncodeContext,
    hooks?: NcpEncodeHooks,
  ): AsyncIterable<NcpEndpointEvent>;
}
