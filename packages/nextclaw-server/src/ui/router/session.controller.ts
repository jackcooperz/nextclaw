import type { Context } from "hono";
import {
  deleteSession,
  getSessionHistory,
  listSessions,
  patchSession,
  SessionPatchValidationError
} from "../config.js";
import type { SessionPatchUpdate } from "../types.js";
import { buildChatSessionTypesView } from "./chat-utils.js";
import { err, ok, readJson } from "./response.js";
import type { UiRouterOptions } from "./types.js";

export class SessionRoutesController {
  constructor(private readonly options: UiRouterOptions) {}

  readonly listSessions = (c: Context) => {
    const query = c.req.query();
    const q = typeof query.q === "string" ? query.q : undefined;
    const limit = typeof query.limit === "string" ? Number.parseInt(query.limit, 10) : undefined;
    const activeMinutes =
      typeof query.activeMinutes === "string" ? Number.parseInt(query.activeMinutes, 10) : undefined;
    const data = listSessions(this.options.configPath, {
      q,
      limit: Number.isFinite(limit) ? limit : undefined,
      activeMinutes: Number.isFinite(activeMinutes) ? activeMinutes : undefined
    });
    return c.json(ok(data));
  };

  readonly getSessionHistory = (c: Context) => {
    const key = decodeURIComponent(c.req.param("key"));
    const query = c.req.query();
    const limit = typeof query.limit === "string" ? Number.parseInt(query.limit, 10) : undefined;
    const data = getSessionHistory(this.options.configPath, key, Number.isFinite(limit) ? limit : undefined);
    if (!data) {
      return c.json(err("NOT_FOUND", `session not found: ${key}`), 404);
    }
    return c.json(ok(data));
  };

  readonly patchSession = async (c: Context) => {
    const key = decodeURIComponent(c.req.param("key"));
    const body = await readJson<Record<string, unknown>>(c.req.raw);
    if (!body.ok || !body.data || typeof body.data !== "object") {
      return c.json(err("INVALID_BODY", "invalid json body"), 400);
    }
    let availableSessionTypes: string[] | undefined;
    if (Object.prototype.hasOwnProperty.call(body.data, "sessionType")) {
      const sessionTypes = await buildChatSessionTypesView(this.options.chatRuntime);
      availableSessionTypes = sessionTypes.options.map((item) => item.value);
    }

    let data: ReturnType<typeof patchSession>;
    try {
      data = patchSession(this.options.configPath, key, body.data as SessionPatchUpdate, {
        ...(availableSessionTypes ? { availableSessionTypes } : {})
      });
    } catch (error) {
      if (error instanceof SessionPatchValidationError) {
        if (error.code === "SESSION_TYPE_IMMUTABLE") {
          return c.json(err(error.code, error.message), 409);
        }
        return c.json(err(error.code, error.message), 400);
      }
      throw error;
    }
    if (!data) {
      return c.json(err("NOT_FOUND", `session not found: ${key}`), 404);
    }
    this.options.publish({ type: "config.updated", payload: { path: "session" } });
    return c.json(ok(data));
  };

  readonly deleteSession = (c: Context) => {
    const key = decodeURIComponent(c.req.param("key"));
    const deleted = deleteSession(this.options.configPath, key);
    if (!deleted) {
      return c.json(err("NOT_FOUND", `session not found: ${key}`), 404);
    }
    this.options.publish({ type: "config.updated", payload: { path: "session" } });
    return c.json(ok({ deleted: true }));
  };
}
