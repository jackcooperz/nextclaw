import type { NcpEndpointEvent, NcpEndpointSubscriber } from "@nextclaw/ncp";

function cloneValue<T>(value: T): T {
  return structuredClone(value);
}

export class EventPublisher {
  private readonly listeners = new Set<NcpEndpointSubscriber>();

  subscribe(listener: NcpEndpointSubscriber): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  publish(event: NcpEndpointEvent): void {
    for (const listener of this.listeners) {
      listener(cloneValue(event));
    }
  }
}
