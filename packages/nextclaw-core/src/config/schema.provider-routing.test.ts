import { describe, expect, it } from "vitest";
import { ConfigSchema, getApiBase, getProviderName } from "./schema.js";

describe("provider apiBase routing", () => {
  it("uses provider default api base for non-gateway providers when apiBase is unset", () => {
    const config = ConfigSchema.parse({
      providers: {
        deepseek: {
          apiKey: "sk-deepseek"
        }
      }
    });

    expect(getApiBase(config, "deepseek-chat")).toBe("https://api.deepseek.com");
  });

  it("prefers explicit provider apiBase over provider default", () => {
    const config = ConfigSchema.parse({
      providers: {
        deepseek: {
          apiKey: "sk-deepseek",
          apiBase: "https://custom.deepseek.example/v1"
        }
      }
    });

    expect(getApiBase(config, "deepseek-chat")).toBe("https://custom.deepseek.example/v1");
  });

  it("routes custom provider by model prefix and uses its explicit apiBase", () => {
    const config = ConfigSchema.parse({
      providers: {
        "custom-1": {
          apiKey: "sk-relay",
          apiBase: "https://relay-b.example.com/v1"
        }
      }
    });

    expect(getProviderName(config, "custom-1/gpt-4o-mini")).toBe("custom-1");
    expect(getApiBase(config, "custom-1/gpt-4o-mini")).toBe("https://relay-b.example.com/v1");
  });
});
