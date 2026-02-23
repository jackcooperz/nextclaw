# 2026-02-23 v0.8.15-discord-streaming-preview

## 迭代完成说明（改了什么）

- 继续使用 `@nextclaw/channel-plugin-discord`，在 `@nextclaw/channel-runtime` 内实现 Discord 预览流式输出（编辑消息实时更新）。
- 新增 Discord 流式配置：`channels.discord.streaming`、`channels.discord.draftChunk`、`channels.discord.textChunkLimit`。
- 发送逻辑按 openclaw 语义对齐：`partial/progress` 走较细粒度预览流，`block` 走较大块更新，`off` 保持原有分片发送。
- 更新配置帮助/标签、UI 渠道表单与使用文档说明。

## 测试 / 验证 / 验收方式

- 工程级验证（规则要求）：
  - `PATH=/opt/homebrew/bin:$PATH pnpm build`
  - `PATH=/opt/homebrew/bin:$PATH pnpm lint`（有历史 max-lines 警告，无错误）
  - `PATH=/opt/homebrew/bin:$PATH pnpm tsc`
- 执行结果：全部通过（仅 lint 警告）。
- 冒烟测试（本地模拟，避免写入仓库目录）：
  - 命令：
    - `PATH=/opt/homebrew/bin:$PATH pnpm --filter nextclaw exec tsx /tmp/nextclaw-discord-stream-smoke.ts`
  - 观察点：同一消息出现多次 `edit` 更新（流式预览），无异常抛出。
  - 执行结果：通过（输出 `sends: 1, edits: 11`）。

## 发布 / 部署方式

- NPM 发布按流程执行：[`docs/workflows/npm-release-process.md`](../../../workflows/npm-release-process.md)
  1. `pnpm changeset`
  2. `pnpm release:version`
  3. `pnpm release:publish`
  - 执行结果：已发布并打 tag（`changeset publish/tag` 完成）。
  - 发布版本摘要：
    - `nextclaw@0.8.12`
    - `@nextclaw/core@0.6.31`
    - `@nextclaw/channel-runtime@0.1.16`
    - `@nextclaw/openclaw-compat@0.1.24`
    - `@nextclaw/server@0.5.7`
    - `@nextclaw/ui@0.5.7`
    - `@nextclaw/channel-plugin-*` 全量 `0.1.5`

## 用户 / 产品视角验收步骤

1. 在配置中启用 Discord 并设置 `channels.discord.streaming` 为 `partial` 或 `block`。
2. 从 Discord 发送一条较长消息触发回复。
3. 观察机器人回复先出现预览消息并持续编辑更新，最终呈现完整文本。
4. 将 `streaming` 设为 `off`，确认恢复为原始一次性/分片发送。
