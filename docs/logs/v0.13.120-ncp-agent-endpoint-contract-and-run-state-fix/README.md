# v0.13.120-ncp-agent-endpoint-contract-and-run-state-fix

## 迭代完成说明（改了什么）
- 调整 `NcpAgentServerEndpoint` 契约：补充 `send`、`stream`、`abort`，并明确 `emit` 为 server 下行事件发布（面向前端订阅/传输）的语义。
- 适配 `createAgentClientFromServer`：请求类事件优先走 `server.send/stream/abort`，非请求类事件仍透传 `server.emit`；新增适配器测试覆盖该行为。
- `DefaultNcpInMemoryAgentBackend` 显式实现 `NcpAgentServerEndpoint`，并将 `abort` 参数改为可选默认 `{}`。
- 修复 ncp demo 前端“AI 回复完成后 stop 按钮不回退为 send”问题：在 `DefaultNcpAgentConversationStateManager` 中，`message.completed`/`message.failed`/`message.abort` 也会清理 `activeRun`，避免仅依赖 `run.finished` 导致状态卡住；新增回归测试。
- 同步更新 `packages/ncp-packages/nextclaw-ncp/docs/USAGE.md` 里 server endpoint 的语义说明。

## 测试/验证/验收方式
- 类型检查：
  - `pnpm -C packages/ncp-packages/nextclaw-ncp tsc`
  - `pnpm -C packages/ncp-packages/nextclaw-ncp-toolkit tsc`
- 单测：
  - `pnpm -C packages/ncp-packages/nextclaw-ncp-toolkit test -- agent-client-from-server`
  - `pnpm -C packages/ncp-packages/nextclaw-ncp-toolkit test -- agent-conversation-state-manager`
- Lint：
  - `pnpm -C packages/ncp-packages/nextclaw-ncp lint`
  - `pnpm -C packages/ncp-packages/nextclaw-ncp-toolkit lint`（通过，存在 1 条既有规则告警：`max-lines-per-function`）

## 发布/部署方式
- 本次涉及协议与 toolkit 运行时行为，按 monorepo 常规流程处理：
  - 如需对外发布，按项目发布规范执行 changeset/version/publish。
  - 若本轮仅本地开发验证，发布步骤标记为“不适用（未执行发布）”。

## 用户/产品视角的验收步骤
- 启动 ncp demo，发送一条消息，等待 AI 回复完成。
- 观察输入区主按钮：在运行期间显示 `stop`，回复完成后自动恢复为 `send`。
- 点击历史会话回放（stream）与停止（abort），确认不会出现按钮长期停留 `stop` 的状态。
- 观察服务端能力：`send/stream/abort` 正常可用，`emit` 仅承担下行事件发布语义。
