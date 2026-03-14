import type { NcpMessage } from "../types/message.js";
import type { NcpAgentRunInput } from "./runtime.js";
import type { NcpModelInput } from "./model.js";

export type NcpContextPrepareOptions = {
  sessionMessages?: ReadonlyArray<NcpMessage>;
  systemPrompt?: string;
  maxMessages?: number;
};

export interface NcpContextBuilder {
  prepare(input: NcpAgentRunInput, options?: NcpContextPrepareOptions): NcpModelInput;
}
