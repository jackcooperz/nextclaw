import type {
  NcpEndpointEvent,
  NcpMessageAbortPayload,
  NcpRequestEnvelope,
  NcpResumeRequestPayload,
} from "../types/events.js";
import type { NcpSessionApi } from "../types/session.js";

export type NcpAgentBackendSendOptions = {
  signal?: AbortSignal;
};

export type NcpAgentBackendReconnectOptions = {
  signal?: AbortSignal;
};

export interface NcpAgentBackendController extends NcpSessionApi {
  send(
    envelope: NcpRequestEnvelope,
    options?: NcpAgentBackendSendOptions,
  ): AsyncIterable<NcpEndpointEvent>;

  reconnect(
    payload: NcpResumeRequestPayload,
    options?: NcpAgentBackendReconnectOptions,
  ): AsyncIterable<NcpEndpointEvent>;

  abort(payload: NcpMessageAbortPayload): Promise<void>;
}

export type NcpAgentReplayProvider = {
  stream(params: {
    payload: NcpResumeRequestPayload;
    signal: AbortSignal;
  }): AsyncIterable<NcpEndpointEvent>;
};
