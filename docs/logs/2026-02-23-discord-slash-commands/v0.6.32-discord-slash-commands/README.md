# 2026-02-23 v0.6.32-discord-slash-commands

## 迭代完成说明（改了什么）

- 新增通用 CommandRegistry，集中维护 Discord Slash 命令与执行逻辑。
- Discord 渠道自动注册原生 Slash 命令，支持小规模 guild 级快速生效，超过阈值自动切到 global。
- 新增命令：`/help`/`/commands`、`/whoami`/`/id`、`/status`、`/reset`/`/new`、`/model`。
- 同步文档与依赖版本：`@nextclaw/core@0.6.32`、`@nextclaw/channel-runtime@0.1.17`、`@nextclaw/openclaw-compat@0.1.25`、`@nextclaw/server@0.5.8`、`nextclaw@0.8.13`。

## 测试 / 验证 / 验收方式

```bash
# build / lint / tsc
PATH=/opt/homebrew/bin:$PATH pnpm build
PATH=/opt/homebrew/bin:$PATH pnpm lint
PATH=/opt/homebrew/bin:$PATH pnpm tsc

# smoke-check（避免写入仓库目录）
TMP_HOME=$(mktemp -d /tmp/nextclaw-discord-slash-smoke.XXXXXX)
NEXTCLAW_HOME="$TMP_HOME" node --input-type=module -e "import { CommandRegistry, ConfigSchema, SessionManager } from './packages/nextclaw-core/dist/index.js';
const config = ConfigSchema.parse({});
const sessions = new SessionManager(config.agents.defaults.workspace);
const registry = new CommandRegistry(config, sessions);
const ctx = { channel: 'discord', chatId: '123', senderId: 'user', sessionKey: 'discord:123' };
const help = await registry.execute('help', {}, ctx);
const model = await registry.execute('model', { name: 'openai/gpt-4.1' }, ctx);
console.log(help.content.includes('/help') && model.content.includes('openai/gpt-4.1') ? 'SMOKE_OK' : 'SMOKE_FAIL');
"
rm -rf "$TMP_HOME"
```

验收点：

- `build/lint/tsc` 全部通过。
- `SMOKE_OK` 输出为真。

## 发布 / 部署方式

- 本次影响 npm 包发布，按 [docs/workflows/npm-release-process.md](../../../workflows/npm-release-process.md) 执行。
- 远程 migration：不适用（本次仅命令/渠道能力改动）。

## 用户/产品视角的验收步骤

1. 启动 gateway，并确保 Discord Bot token 已配置。
2. 在 Discord 服务器中输入 `/help`，确认命令立即出现并返回命令列表（应为 ephemeral）。
3. 输入 `/model openai/gpt-4.1`，确认返回“Model set to …”。
4. 输入 `/reset`，确认返回“Conversation history cleared …”。
5. 在多个 guild 中验证：当 guild 数量不多时命令立即可用；若 guild 数量超过阈值，global 注册可能需要等待同步生效。
