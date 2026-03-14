import type {
  NcpEndpointEvent,
  NcpRequestEnvelope,
  NcpResumeRequestPayload,
} from "../types/events.js";
import type { NcpMessage } from "../types/message.js";

export type NcpAgentRunInput =
  | { kind: "request"; payload: NcpRequestEnvelope }
  | { kind: "resume"; payload: NcpResumeRequestPayload };

export type NcpAgentRunOptions = {
  signal?: AbortSignal;
  sessionMessages?: ReadonlyArray<NcpMessage>;
};

export interface NcpAgentRuntime {
  run(
    input: NcpAgentRunInput,
    options?: NcpAgentRunOptions,
  ): AsyncIterable<NcpEndpointEvent>;
}
