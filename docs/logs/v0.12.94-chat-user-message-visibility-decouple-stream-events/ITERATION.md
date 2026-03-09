# v0.12.94 chat user message visibility decouple stream events

## 迭代完成说明（改了什么）
- 明确并落实“用户消息展示不受后端流事件影响”的约束。
- `stream-run-controller.ts`：在流处理 `onSessionEvent` 中忽略 `role=user` 的 streamed event，不再让其覆盖/扰动本地 optimistic 用户消息。
- `chat-page-runtime.ts`：在 `useMergedEvents` 中过滤非本地的 streamed user event（仅保留 `message.user.optimistic`），确保用户消息展示来源稳定为“本地 optimistic + 历史消息”。
- 保留此前路由稳定化改动（`/chat/:sessionId?`），避免新会话首发时组件重挂载导致流本地状态丢失。

## 测试/验证/验收方式
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui tsc --noEmit`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui exec eslint src/components/chat/chat-stream/stream-run-controller.ts src/components/chat/chat-page-runtime.ts src/App.tsx`
- `PATH=/opt/homebrew/bin:$PATH pnpm build:ui`

## 发布/部署方式
- 本次为前端行为修复，无额外发布流程变更。
- 如需发布，按既有前端发布流程执行并补冒烟记录。

## 用户/产品视角的验收步骤
1. 新会话输入一条消息并发送，不做其它操作；确认用户消息立即出现。
2. 在 AI 回复流式过程中，确认该用户消息始终可见、不闪消。
3. 回复结束后确认会话状态恢复正常；刷新页面后历史一致。
