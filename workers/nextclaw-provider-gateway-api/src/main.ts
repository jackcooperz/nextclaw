import { Hono } from "hono";

type Env = {
  DASHSCOPE_API_KEY?: string;
  DASHSCOPE_API_BASE?: string;
  FREE_TRIAL_USD_LIMIT?: string;
  FREE_TRIAL_FLAT_USD_PER_REQUEST?: string;
  NEXTCLAW_QUOTA: DurableObjectNamespace;
};

type SupportedModelSpec = {
  id: string;
  upstreamModel: string;
  displayName: string;
  inputUsdPer1M: number;
  outputUsdPer1M: number;
};

type ChatCompletionRequest = {
  model: string;
  messages: Array<Record<string, unknown>>;
  stream?: boolean;
  max_tokens?: number;
  max_completion_tokens?: number;
  [key: string]: unknown;
};

type UsageCounters = {
  promptTokens: number;
  completionTokens: number;
};

type QuotaState = {
  totalCostUsd: number;
  totalRequests: number;
  promptTokens: number;
  completionTokens: number;
  updatedAt: string;
};

type ChargeRequest = {
  costUsd: number;
  requestCount: number;
  promptTokens: number;
  completionTokens: number;
};

const DEFAULT_DASHSCOPE_API_BASE = "https://dashscope.aliyuncs.com/compatible-mode/v1";
const DEFAULT_FREE_TRIAL_USD_LIMIT = 0.5;
const DEFAULT_FREE_TRIAL_FLAT_USD_PER_REQUEST = 0.0002;
const DO_STATE_KEY = "usage";

const SUPPORTED_MODELS: SupportedModelSpec[] = [
  {
    id: "dashscope/qwen3.5-plus",
    upstreamModel: "qwen3.5-plus",
    displayName: "Qwen3.5 Plus",
    inputUsdPer1M: 0.8,
    outputUsdPer1M: 2.4
  },
  {
    id: "dashscope/qwen3.5-flash",
    upstreamModel: "qwen3.5-flash",
    displayName: "Qwen3.5 Flash",
    inputUsdPer1M: 0.2,
    outputUsdPer1M: 0.6
  },
  {
    id: "dashscope/qwen3.5-397b-a17b",
    upstreamModel: "qwen3.5-397b-a17b",
    displayName: "Qwen3.5 397B A17B",
    inputUsdPer1M: 1.2,
    outputUsdPer1M: 3.6
  },
  {
    id: "dashscope/qwen3.5-122b-a10b",
    upstreamModel: "qwen3.5-122b-a10b",
    displayName: "Qwen3.5 122B A10B",
    inputUsdPer1M: 0.6,
    outputUsdPer1M: 1.8
  },
  {
    id: "dashscope/qwen3.5-35b-a3b",
    upstreamModel: "qwen3.5-35b-a3b",
    displayName: "Qwen3.5 35B A3B",
    inputUsdPer1M: 0.35,
    outputUsdPer1M: 1.05
  },
  {
    id: "dashscope/qwen3.5-27b",
    upstreamModel: "qwen3.5-27b",
    displayName: "Qwen3.5 27B",
    inputUsdPer1M: 0.28,
    outputUsdPer1M: 0.84
  }
];

const MODEL_MAP = new Map<string, SupportedModelSpec>(SUPPORTED_MODELS.map((model) => [model.id, model]));

const app = new Hono<{ Bindings: Env }>();

app.get("/health", (c) => {
  return c.json({
    ok: true,
    data: {
      status: "ok",
      service: "nextclaw-provider-gateway-api"
    }
  });
});

app.get("/v1/models", (c) => {
  return c.json({
    object: "list",
    data: SUPPORTED_MODELS.map((model) => ({
      id: model.id,
      object: "model",
      created: 0,
      owned_by: "nextclaw",
      display_name: model.displayName
    }))
  });
});

app.get("/v1/usage", async (c) => {
  const apiKey = parseBearerToken(c.req.header("authorization"));
  if (!apiKey) {
    return openaiError(c, 401, "Missing bearer token.", "invalid_api_key");
  }

  const quotaKey = await buildQuotaKey(apiKey);
  const state = await readQuotaState(c.env, quotaKey);
  const limit = getFreeTrialUsdLimit(c.env);

  return c.json({
    object: "nextclaw.usage",
    data: {
      totalCostUsd: roundCost(state.totalCostUsd),
      totalRequests: state.totalRequests,
      promptTokens: state.promptTokens,
      completionTokens: state.completionTokens,
      freeTrialUsdLimit: roundCost(limit),
      freeTrialUsdRemaining: roundCost(Math.max(0, limit - state.totalCostUsd)),
      updatedAt: state.updatedAt
    }
  });
});

app.post("/v1/chat/completions", async (c) => {
  if (!c.env.DASHSCOPE_API_KEY || c.env.DASHSCOPE_API_KEY.trim().length === 0) {
    return openaiError(c, 503, "Upstream provider is not configured.", "service_unavailable");
  }

  const apiKey = parseBearerToken(c.req.header("authorization"));
  if (!apiKey) {
    return openaiError(c, 401, "Missing bearer token.", "invalid_api_key");
  }

  let body: ChatCompletionRequest;
  try {
    body = await c.req.json<ChatCompletionRequest>();
  } catch {
    return openaiError(c, 400, "Invalid JSON payload.", "invalid_request_error");
  }

  if (typeof body.model !== "string" || body.model.trim().length === 0) {
    return openaiError(c, 400, "model is required.", "invalid_request_error");
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return openaiError(c, 400, "messages must be a non-empty array.", "invalid_request_error");
  }

  const requestedModel = body.model.trim();
  const modelSpec = MODEL_MAP.get(requestedModel);
  if (!modelSpec) {
    return openaiError(
      c,
      400,
      `Model '${requestedModel}' is not available in NextClaw free trial catalog.`,
      "model_not_found"
    );
  }

  const quotaKey = await buildQuotaKey(apiKey);
  const quotaState = await readQuotaState(c.env, quotaKey);
  const usageEstimate = estimateUsage(body.messages, resolveMaxCompletionTokens(body));
  const estimatedCost =
    calculateCost(modelSpec, usageEstimate) + getFreeTrialFlatUsdPerRequest(c.env);
  const limit = getFreeTrialUsdLimit(c.env);

  if (quotaState.totalCostUsd + estimatedCost > limit) {
    return c.json(
      {
        error: {
          message: "Free trial quota exceeded. Please configure your own provider key to continue.",
          type: "insufficient_quota",
          param: null,
          code: "insufficient_quota"
        },
        usage: {
          totalCostUsd: roundCost(quotaState.totalCostUsd),
          freeTrialUsdLimit: roundCost(limit),
          freeTrialUsdRemaining: roundCost(Math.max(0, limit - quotaState.totalCostUsd))
        }
      },
      429
    );
  }

  const upstreamUrl = new URL("chat/completions", withTrailingSlash(getDashscopeApiBase(c.env))).toString();
  const upstreamPayload: Record<string, unknown> = {
    ...body,
    model: modelSpec.upstreamModel
  };

  const upstreamResponse = await fetch(upstreamUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${c.env.DASHSCOPE_API_KEY.trim()}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(upstreamPayload)
  });

  if (body.stream === true && upstreamResponse.body) {
    const [clientStream, quotaStream] = upstreamResponse.body.tee();
    if (upstreamResponse.ok) {
      c.executionCtx.waitUntil(
        chargeFromStream({
          env: c.env,
          quotaKey,
          modelSpec,
          stream: quotaStream,
          fallback: usageEstimate
        })
      );
    }
    return new Response(clientStream, {
      status: upstreamResponse.status,
      headers: sanitizeResponseHeaders(upstreamResponse.headers)
    });
  }

  const rawText = await upstreamResponse.text();
  if (!upstreamResponse.ok) {
    return new Response(rawText, {
      status: upstreamResponse.status,
      headers: sanitizeResponseHeaders(upstreamResponse.headers)
    });
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(rawText) as Record<string, unknown>;
  } catch {
    return openaiError(c, 502, "Upstream returned invalid JSON.", "upstream_invalid_response");
  }

  const usage = extractUsageCounters(parsed, usageEstimate);
  await chargeUsage(c.env, quotaKey, modelSpec, usage);

  parsed.model = requestedModel;
  return c.json(parsed);
});

app.notFound((c) => openaiError(c, 404, "endpoint not found", "not_found"));

app.onError((error, c) => {
  return openaiError(c, 500, error.message || "internal error", "internal_error");
});

export class NextclawQuotaDurableObject {
  private readonly state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/state") {
      return jsonResponse(await this.readState());
    }

    if (request.method === "POST" && url.pathname === "/charge") {
      const payload = await request.json<ChargeRequest>();
      const current = await this.readState();
      const next: QuotaState = {
        totalCostUsd: current.totalCostUsd + normalizeNonNegativeNumber(payload.costUsd),
        totalRequests: current.totalRequests + normalizeNonNegativeInteger(payload.requestCount),
        promptTokens: current.promptTokens + normalizeNonNegativeInteger(payload.promptTokens),
        completionTokens: current.completionTokens + normalizeNonNegativeInteger(payload.completionTokens),
        updatedAt: new Date().toISOString()
      };
      await this.state.storage.put(DO_STATE_KEY, next);
      return jsonResponse(next);
    }

    return new Response("Not Found", { status: 404 });
  }

  private async readState(): Promise<QuotaState> {
    const stored = await this.state.storage.get<QuotaState>(DO_STATE_KEY);
    if (!stored) {
      return {
        totalCostUsd: 0,
        totalRequests: 0,
        promptTokens: 0,
        completionTokens: 0,
        updatedAt: new Date(0).toISOString()
      };
    }
    return stored;
  }
}

async function chargeFromStream(params: {
  env: Env;
  quotaKey: string;
  modelSpec: SupportedModelSpec;
  stream: ReadableStream;
  fallback: UsageCounters;
}): Promise<void> {
  const decoder = new TextDecoder();
  const reader = params.stream.getReader();
  let buffer = "";
  let usage: UsageCounters | null = null;

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    if (!value) {
      continue;
    }
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith("data:")) {
        continue;
      }
      const data = line.slice("data:".length).trim();
      if (data.length === 0 || data === "[DONE]") {
        continue;
      }
      try {
        const chunk = JSON.parse(data) as Record<string, unknown>;
        if (isRecord(chunk.usage)) {
          usage = extractUsageCounters(chunk, usage ?? params.fallback);
        }
      } catch {
        // ignore malformed chunk
      }
    }
  }

  await chargeUsage(params.env, params.quotaKey, params.modelSpec, usage ?? params.fallback);
}

async function chargeUsage(
  env: Env,
  quotaKey: string,
  modelSpec: SupportedModelSpec,
  usage: UsageCounters
): Promise<void> {
  const costUsd =
    calculateCost(modelSpec, usage) + getFreeTrialFlatUsdPerRequest(env);
  const stub = env.NEXTCLAW_QUOTA.get(env.NEXTCLAW_QUOTA.idFromName(quotaKey));
  await stub.fetch("https://quota/charge", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      costUsd,
      requestCount: 1,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens
    } satisfies ChargeRequest)
  });
}

async function readQuotaState(env: Env, quotaKey: string): Promise<QuotaState> {
  const stub = env.NEXTCLAW_QUOTA.get(env.NEXTCLAW_QUOTA.idFromName(quotaKey));
  const response = await stub.fetch("https://quota/state");
  if (!response.ok) {
    return {
      totalCostUsd: 0,
      totalRequests: 0,
      promptTokens: 0,
      completionTokens: 0,
      updatedAt: new Date(0).toISOString()
    };
  }
  const state = await response.json<QuotaState>();
  return {
    totalCostUsd: normalizeNonNegativeNumber(state.totalCostUsd),
    totalRequests: normalizeNonNegativeInteger(state.totalRequests),
    promptTokens: normalizeNonNegativeInteger(state.promptTokens),
    completionTokens: normalizeNonNegativeInteger(state.completionTokens),
    updatedAt: typeof state.updatedAt === "string" && state.updatedAt.trim().length > 0
      ? state.updatedAt
      : new Date(0).toISOString()
  };
}

function extractUsageCounters(payload: Record<string, unknown>, fallback: UsageCounters): UsageCounters {
  if (!isRecord(payload.usage)) {
    return fallback;
  }

  return {
    promptTokens: normalizeNonNegativeInteger(payload.usage.prompt_tokens),
    completionTokens: normalizeNonNegativeInteger(payload.usage.completion_tokens)
  };
}

function estimateUsage(messages: Array<Record<string, unknown>>, completionTokens: number): UsageCounters {
  const serialized = JSON.stringify(messages);
  const promptTokens = Math.max(1, Math.ceil(serialized.length / 4));
  return {
    promptTokens,
    completionTokens
  };
}

function resolveMaxCompletionTokens(body: ChatCompletionRequest): number {
  const direct = normalizeNonNegativeInteger(body.max_tokens);
  if (direct > 0) {
    return Math.min(8192, direct);
  }
  const modern = normalizeNonNegativeInteger(body.max_completion_tokens);
  if (modern > 0) {
    return Math.min(8192, modern);
  }
  return 1024;
}

function calculateCost(modelSpec: SupportedModelSpec, usage: UsageCounters): number {
  return (usage.promptTokens / 1_000_000) * modelSpec.inputUsdPer1M +
    (usage.completionTokens / 1_000_000) * modelSpec.outputUsdPer1M;
}

function parseBearerToken(header: string | undefined): string | null {
  if (!header) {
    return null;
  }
  const parts = header.trim().split(/\s+/);
  const scheme = parts[0];
  const rawToken = parts[1];
  if (parts.length !== 2 || !scheme || !rawToken || scheme.toLowerCase() !== "bearer") {
    return null;
  }
  const token = rawToken.trim();
  return token.length > 0 ? token : null;
}

function getDashscopeApiBase(env: Env): string {
  return normalizeNonEmptyString(env.DASHSCOPE_API_BASE) ?? DEFAULT_DASHSCOPE_API_BASE;
}

function getFreeTrialUsdLimit(env: Env): number {
  return parsePositiveNumber(env.FREE_TRIAL_USD_LIMIT, DEFAULT_FREE_TRIAL_USD_LIMIT);
}

function getFreeTrialFlatUsdPerRequest(env: Env): number {
  return parsePositiveNumber(env.FREE_TRIAL_FLAT_USD_PER_REQUEST, DEFAULT_FREE_TRIAL_FLAT_USD_PER_REQUEST);
}

function parsePositiveNumber(raw: string | undefined, fallback: number): number {
  if (!raw) {
    return fallback;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function normalizeNonNegativeNumber(raw: unknown): number {
  if (typeof raw !== "number" || !Number.isFinite(raw) || raw < 0) {
    return 0;
  }
  return raw;
}

function normalizeNonNegativeInteger(raw: unknown): number {
  if (typeof raw !== "number" || !Number.isFinite(raw) || raw <= 0) {
    return 0;
  }
  return Math.floor(raw);
}

function normalizeNonEmptyString(raw: string | undefined): string | null {
  if (typeof raw !== "string") {
    return null;
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function withTrailingSlash(base: string): string {
  return base.endsWith("/") ? base : `${base}/`;
}

function sanitizeResponseHeaders(headers: Headers): Headers {
  const next = new Headers(headers);
  next.delete("content-length");
  return next;
}

function roundCost(value: number): number {
  return Math.round(value * 1000000) / 1000000;
}

function openaiError(c: { json: (body: unknown, status?: number) => Response }, status: number, message: string, code: string): Response {
  return c.json(
    {
      error: {
        message,
        type: status >= 500 ? "server_error" : "invalid_request_error",
        param: null,
        code
      }
    },
    status
  );
}

async function buildQuotaKey(apiKey: string): Promise<string> {
  const input = new TextEncoder().encode(apiKey);
  const digest = await crypto.subtle.digest("SHA-256", input);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes)
    .map((part) => part.toString(16).padStart(2, "0"))
    .join("");
}

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json"
    }
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export default app;
