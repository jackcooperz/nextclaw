import {
  DefaultNcpAgentRuntime,
  DefaultNcpContextBuilder,
  DefaultNcpToolRegistry,
} from "@nextclaw/ncp-agent-runtime";
import {
  DefaultNcpAgentBackend,
  InMemoryAgentRunStore,
  InMemoryAgentSessionStore,
  InMemoryRunControllerRegistry,
} from "@nextclaw/ncp-toolkit";
import { createClockTool } from "./tools/clock-tool.js";
import { createLlmApi, type DemoLlmMode } from "./llm/create-llm-api.js";

export type { DemoLlmMode } from "./llm/create-llm-api.js";

export function createDemoBackend(): { backend: DefaultNcpAgentBackend; llmMode: DemoLlmMode } {
  const llm = createLlmApi();
  return {
    backend: new DefaultNcpAgentBackend({
      endpointId: "ncp-demo-agent",
      sessionStore: new InMemoryAgentSessionStore(),
      runStore: new InMemoryAgentRunStore(),
      controllerRegistry: new InMemoryRunControllerRegistry(),
      createRuntime: ({ stateManager }) => {
        const toolRegistry = new DefaultNcpToolRegistry([createClockTool()]);
        return new DefaultNcpAgentRuntime({
          contextBuilder: new DefaultNcpContextBuilder(toolRegistry),
          llmApi: llm.api,
          toolRegistry,
          stateManager,
        });
      },
    }),
    llmMode: llm.mode,
  };
}
