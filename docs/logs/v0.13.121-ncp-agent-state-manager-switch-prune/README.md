# v0.13.121-ncp-agent-state-manager-switch-prune

## 迭代完成说明（改了什么）
- 适配 `DefaultNcpAgentConversationStateManager` 的事件收敛：按当前 switch 保留事件集合工作，移除不再处理的 handler（`message.request/accepted/incoming/completed/failed`）。
- 为避免删减事件后出现会话状态回归，把消息收敛逻辑迁移到 run 生命周期：
  - `run.finished` 时将 `streamingMessage` 落盘到 `messages` 并清空。
  - `run.error` 时将 `streamingMessage` 标记为 `error` 落盘并清空。
- 同步裁剪协议接口 `NcpAgentConversationStateManager`，删除上述不再必需的 handler 声明，保证类型层与实现一致。
- 更新状态管理器测试，改为基于 `run.finished/run.error` 断言最终收敛行为。

## 测试/验证/验收方式
- `pnpm -C packages/ncp-packages/nextclaw-ncp tsc`
- `pnpm -C packages/ncp-packages/nextclaw-ncp-toolkit tsc`
- `pnpm -C packages/ncp-packages/nextclaw-ncp-toolkit lint`
- `pnpm -C packages/ncp-packages/nextclaw-ncp-toolkit test -- agent-conversation-state-manager`
- `pnpm -C packages/ncp-packages/nextclaw-ncp-toolkit test -- agent-client-from-server`

## 发布/部署方式
- 本次为协议/状态管理器代码改动，按 monorepo 常规发布流程处理（changeset/version/publish）。
- 若本轮仅本地联调，不执行发布则标注“不适用（未执行发布）”。

## 用户/产品视角的验收步骤
- 在 ncp demo 发送消息，观察回复流结束后：
  - 回复内容保留在消息列表中；
  - 运行态清空，可再次发送。
- 模拟运行错误（或触发 abort）后，观察当前流式消息会被收敛为错误状态而不是悬挂。
- 连续发送两轮消息，确认前一轮 assistant 内容不会丢失。
