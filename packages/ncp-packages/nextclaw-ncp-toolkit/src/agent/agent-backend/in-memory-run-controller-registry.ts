import type { RunControllerRegistry } from "./agent-backend-types.js";

export class InMemoryRunControllerRegistry implements RunControllerRegistry {
  private readonly controllers = new Map<string, AbortController>();

  register(runId: string, controller: AbortController): void {
    this.controllers.set(runId, controller);
  }

  abort(runId: string): void {
    this.controllers.get(runId)?.abort();
    this.controllers.delete(runId);
  }

  delete(runId: string): void {
    this.controllers.delete(runId);
  }

  abortAll(): void {
    for (const controller of this.controllers.values()) {
      controller.abort();
    }

    this.controllers.clear();
  }
}
