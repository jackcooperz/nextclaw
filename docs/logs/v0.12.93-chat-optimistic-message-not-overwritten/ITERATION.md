# v0.12.93 chat optimistic message not overwritten

## 迭代完成说明（改了什么）
- 修复“发送后用户消息要等 AI 完整回复后才出现”的问题。
- 根因：事件合并按 `seq` 去重时，`message` 事件会被同 `seq` 的非 `message` 事件覆盖，导致线程短时间内无可渲染用户消息。
- 修复点：
  - `chat-stream/stream-run-controller.ts` 的 `upsertStreamingEvent`：当已有事件包含 `message` 而新事件不含 `message` 时，不覆盖。
  - `chat-page-runtime.ts` 的 `useMergedEvents`：同样加入“message 优先”合并策略，防止 optimistic user event 被无消息事件顶掉。

## 测试/验证/验收方式
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui tsc --noEmit`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui exec eslint src/components/chat/chat-stream/stream-run-controller.ts src/components/chat/chat-page-runtime.ts`
- `PATH=/opt/homebrew/bin:$PATH pnpm build:ui`

## 发布/部署方式
- 本次为前端修复，无额外发布流程变更。
- 如需发布，按既有前端发布流程执行并补冒烟记录。

## 用户/产品视角的验收步骤
1. 在新会话发送一条消息，确认用户消息立即可见。
2. 在 AI 流式回复过程中，确认用户消息不消失。
3. 回复结束后刷新页面，确认会话历史一致。
