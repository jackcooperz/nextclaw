import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { ConfigSchema, saveConfig } from "@nextclaw/core";
import { createUiRouter } from "./router.js";

const tempDirs: string[] = [];

function createTempConfigPath(): string {
  const dir = mkdtempSync(join(tmpdir(), "nextclaw-ui-provider-test-"));
  tempDirs.push(dir);
  return join(dir, "config.json");
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("provider connection test route", () => {
  it("returns 404 for unknown provider", async () => {
    const configPath = createTempConfigPath();
    saveConfig(ConfigSchema.parse({}), configPath);

    const app = createUiRouter({
      configPath,
      publish: () => {}
    });

    const response = await app.request("http://localhost/api/config/providers/not-exists/test", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({})
    });

    expect(response.status).toBe(404);
    const payload = await response.json() as {
      ok: false;
      error: {
        code: string;
      };
    };
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe("NOT_FOUND");
  });

  it("returns a failed result when api key is explicitly empty", async () => {
    const configPath = createTempConfigPath();
    saveConfig(ConfigSchema.parse({}), configPath);

    const app = createUiRouter({
      configPath,
      publish: () => {}
    });

    const response = await app.request("http://localhost/api/config/providers/openai/test", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        apiKey: ""
      })
    });

    expect(response.status).toBe(200);
    const payload = await response.json() as {
      ok: true;
      data: {
        success: boolean;
        message: string;
      };
    };
    expect(payload.ok).toBe(true);
    expect(payload.data.success).toBe(false);
    expect(payload.data.message).toContain("API key is required");
  });

  it("persists provider custom models and exposes provider default models in meta", async () => {
    const configPath = createTempConfigPath();
    saveConfig(ConfigSchema.parse({}), configPath);

    const app = createUiRouter({
      configPath,
      publish: () => {}
    });

    const updateResponse = await app.request("http://localhost/api/config/providers/deepseek", {
      method: "PUT",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        models: [" deepseek-chat ", "deepseek/deepseek-reasoner", "deepseek-chat", ""]
      })
    });
    expect(updateResponse.status).toBe(200);
    const updatePayload = await updateResponse.json() as {
      ok: true;
      data: {
        models?: string[];
      };
    };
    expect(updatePayload.ok).toBe(true);
    expect(updatePayload.data.models).toEqual(["deepseek-chat", "deepseek/deepseek-reasoner"]);

    const configResponse = await app.request("http://localhost/api/config");
    expect(configResponse.status).toBe(200);
    const configPayload = await configResponse.json() as {
      ok: true;
      data: {
        providers: Record<string, { models?: string[] }>;
      };
    };
    expect(configPayload.data.providers.deepseek.models).toEqual(["deepseek-chat", "deepseek/deepseek-reasoner"]);

    const metaResponse = await app.request("http://localhost/api/config/meta");
    expect(metaResponse.status).toBe(200);
    const metaPayload = await metaResponse.json() as {
      ok: true;
      data: {
        providers: Array<{
          name: string;
          defaultModels?: string[];
        }>;
      };
    };
    const deepseekSpec = metaPayload.data.providers.find((provider) => provider.name === "deepseek");
    expect(deepseekSpec?.defaultModels?.length ?? 0).toBeGreaterThan(0);
    expect(deepseekSpec?.defaultModels).toContain("deepseek/deepseek-chat");
  });
});
