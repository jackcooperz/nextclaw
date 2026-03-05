import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { loadConfig } from "./loader.js";

describe("loadConfig nextclaw built-in provider bootstrap", () => {
  it("auto-generates and persists nextclaw apiKey for empty config", () => {
    const dir = mkdtempSync(join(tmpdir(), "nextclaw-config-nextclaw-"));
    const configPath = join(dir, "config.json");

    const first = loadConfig(configPath);
    const second = loadConfig(configPath);

    expect(first.providers.nextclaw.apiKey).toMatch(/^nc_free_/);
    expect(second.providers.nextclaw.apiKey).toBe(first.providers.nextclaw.apiKey);
  });
});
