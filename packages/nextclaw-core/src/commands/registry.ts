import type { Config } from "../config/schema.js";
import type { SessionManager } from "../session/manager.js";

export type CommandOptionType = "string" | "boolean" | "number";

export type CommandOption = {
  name: string;
  description: string;
  type: CommandOptionType;
  required?: boolean;
};

export type CommandExecutionContext = {
  channel: string;
  chatId: string;
  senderId: string;
  sessionKey?: string;
};

export type CommandResult = {
  content: string;
  ephemeral?: boolean;
};

type CommandHandlerContext = CommandExecutionContext & {
  sessionKey: string;
  config: Config;
  sessionManager?: SessionManager;
};

type CommandSpec = {
  name: string;
  description: string;
  options?: CommandOption[];
  aliases?: string[];
  execute: (ctx: CommandHandlerContext, args: Record<string, unknown>) => Promise<CommandResult> | CommandResult;
};

type SlashCommandSpec = {
  name: string;
  description: string;
  options?: CommandOption[];
};

const DEFAULT_EPHEMERAL = true;
const CLEAR_MODEL_TOKENS = new Set(["clear", "reset", "off", "none"]);

export class CommandRegistry {
  private specs: CommandSpec[] = [];
  private lookup = new Map<string, CommandSpec>();

  constructor(private config: Config, private sessionManager?: SessionManager) {
    this.registerDefaults();
  }

  listSlashCommands(): SlashCommandSpec[] {
    const commands: SlashCommandSpec[] = [];
    for (const spec of this.specs) {
      commands.push({ name: spec.name, description: spec.description, options: spec.options });
      for (const alias of spec.aliases ?? []) {
        commands.push({ name: alias, description: spec.description, options: spec.options });
      }
    }
    return commands;
  }

  async execute(
    name: string,
    args: Record<string, unknown> | undefined,
    ctx: CommandExecutionContext
  ): Promise<CommandResult> {
    const trimmedName = normalizeCommandName(name);
    const spec = this.lookup.get(trimmedName);
    if (!spec) {
      return {
        content: `Unknown command: /${trimmedName}. Try /help for the command list.`,
        ephemeral: DEFAULT_EPHEMERAL
      };
    }
    const sessionKey = ctx.sessionKey ?? `${ctx.channel}:${ctx.chatId}`;
    const commandCtx: CommandHandlerContext = {
      ...ctx,
      sessionKey,
      config: this.config,
      sessionManager: this.sessionManager
    };
    return await spec.execute(commandCtx, args ?? {});
  }

  private registerDefaults(): void {
    this.register({
      name: "help",
      description: "Show available commands",
      aliases: ["commands"],
      execute: () => ({
        content: this.buildHelpText(),
        ephemeral: DEFAULT_EPHEMERAL
      })
    });

    this.register({
      name: "whoami",
      description: "Show your sender and session info",
      aliases: ["id"],
      execute: (ctx) => ({
        content: [
          `Channel: ${ctx.channel}`,
          `Sender: ${ctx.senderId}`,
          `Chat: ${ctx.chatId}`,
          `Session: ${ctx.sessionKey}`
        ].join("\n"),
        ephemeral: DEFAULT_EPHEMERAL
      })
    });

    this.register({
      name: "status",
      description: "Show current session status",
      execute: (ctx) => {
        const session = ctx.sessionManager?.getIfExists(ctx.sessionKey);
        const model = this.resolveSessionModel(session?.metadata);
        return {
          content: [`Session: ${ctx.sessionKey}`, `Model: ${model}`].join("\n"),
          ephemeral: DEFAULT_EPHEMERAL
        };
      }
    });

    this.register({
      name: "reset",
      description: "Reset conversation history",
      aliases: ["new"],
      execute: (ctx) => {
        if (!ctx.sessionManager) {
          return { content: "Session management is not available.", ephemeral: DEFAULT_EPHEMERAL };
        }
        const session = ctx.sessionManager.getOrCreate(ctx.sessionKey);
        const totalCleared = session.messages.length;
        ctx.sessionManager.clear(session);
        ctx.sessionManager.save(session);
        return {
          content: `Conversation history cleared (${totalCleared} messages).`,
          ephemeral: DEFAULT_EPHEMERAL
        };
      }
    });

    this.register({
      name: "model",
      description: "Get or set the session model",
      options: [
        {
          name: "name",
          description: "Model name (or 'clear' to reset)",
          type: "string",
          required: false
        }
      ],
      execute: (ctx, args) => {
        if (!ctx.sessionManager) {
          return { content: "Session management is not available.", ephemeral: DEFAULT_EPHEMERAL };
        }
        const session = ctx.sessionManager.getOrCreate(ctx.sessionKey);
        const raw = typeof args.name === "string" ? args.name.trim() : "";
        if (!raw) {
          const model = this.resolveSessionModel(session.metadata);
          return { content: `Current model: ${model}`, ephemeral: DEFAULT_EPHEMERAL };
        }
        const lowered = raw.toLowerCase();
        if (CLEAR_MODEL_TOKENS.has(lowered)) {
          delete session.metadata.preferred_model;
          ctx.sessionManager.save(session);
          const model = this.resolveSessionModel(session.metadata);
          return { content: `Model override cleared. Current model: ${model}`, ephemeral: DEFAULT_EPHEMERAL };
        }
        session.metadata.preferred_model = raw;
        ctx.sessionManager.save(session);
        return { content: `Model set to ${raw}.`, ephemeral: DEFAULT_EPHEMERAL };
      }
    });
  }

  private register(spec: CommandSpec): void {
    const name = normalizeCommandName(spec.name);
    if (this.lookup.has(name)) {
      return;
    }
    const normalizedSpec: CommandSpec = { ...spec, name };
    this.specs.push(normalizedSpec);
    this.lookup.set(name, normalizedSpec);
    for (const alias of spec.aliases ?? []) {
      const normalized = normalizeCommandName(alias);
      if (!this.lookup.has(normalized)) {
        this.lookup.set(normalized, normalizedSpec);
      }
    }
  }

  private buildHelpText(): string {
    const lines: string[] = ["Available commands:"];
    const specs = [...this.specs].sort((a, b) => a.name.localeCompare(b.name));
    for (const spec of specs) {
      const optionText = (spec.options ?? [])
        .map((opt) => `${opt.required ? "<" : "["}${opt.name}${opt.required ? ">" : "]"}`)
        .join(" ");
      const aliasText =
        spec.aliases && spec.aliases.length > 0 ? ` (alias: ${spec.aliases.map((a) => `/${a}`).join(", ")})` : "";
      const usage = optionText ? `/${spec.name} ${optionText}` : `/${spec.name}`;
      lines.push(`${usage} — ${spec.description}${aliasText}`);
    }
    return lines.join("\n");
  }

  private resolveSessionModel(metadata: Record<string, unknown> | undefined): string {
    const preferred =
      metadata && typeof metadata.preferred_model === "string" ? metadata.preferred_model.trim() : "";
    if (preferred) {
      return preferred;
    }
    return this.config.agents.defaults.model;
  }
}

function normalizeCommandName(name: string): string {
  return name.trim().toLowerCase();
}
