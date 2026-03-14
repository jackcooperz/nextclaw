# v0.13.91-ncp-agent-runtime-and-session-api

## 迭代完成说明（改了什么）
- 新增包 [`packages/nextclaw-ncp-agent-runtime`](../../../packages/nextclaw-ncp-agent-runtime/package.json)，提供默认 NCP agent runtime 组装能力：
  - `DefaultNcpAgentRuntime`
  - `DefaultNcpContextBuilder`
  - `DefaultNcpStreamEncoder`
  - `DefaultNcpToolRegistry`
  - `EchoNcpModel`
- 在 [`packages/nextclaw-ncp/src/index.ts`](../../../packages/nextclaw-ncp/src/index.ts) 导出新增的 agent-runtime / agent-backend 类型入口。
- 扩展会话 API：
  - [`packages/nextclaw-ncp/src/types/session.ts`](../../../packages/nextclaw-ncp/src/types/session.ts) 将 `NcpSessionQueryApi` 升级为 `NcpSessionApi`，新增 `deleteSession(sessionId)`。
- 更新 workspace 构建链路与版本发布元信息：
  - 根 [`package.json`](../../../package.json) 将 `@nextclaw/ncp-agent-runtime` 纳入 `build/lint/tsc` 脚本。
  - 更新相关 NCP 包版本与 changelog，并刷新锁文件 [`pnpm-lock.yaml`](../../../pnpm-lock.yaml)。

## 测试/验证/验收方式
- 受影响包最小充分验证：
  - `pnpm -C packages/nextclaw-ncp lint`
  - `pnpm -C packages/nextclaw-ncp tsc`
  - `pnpm -C packages/nextclaw-ncp build`
  - `pnpm -C packages/nextclaw-ncp-agent-runtime lint`
  - `pnpm -C packages/nextclaw-ncp-agent-runtime tsc`
  - `pnpm -C packages/nextclaw-ncp-agent-runtime build`
- 冒烟测试（可运行行为）：
  - 运行 Node 脚本实例化 `DefaultNcpAgentRuntime + EchoNcpModel + DefaultNcpToolRegistry`，验证完整事件流包含：
    - `run.started`
    - `message.accepted`
    - `message.text-start`
    - `message.text-delta`
    - `message.text-end`
    - `message.completed`
    - `run.finished`
  - 结果：通过（输出 `ncp-agent-runtime smoke ok`）。

## 发布/部署方式
- 本次为 NCP 包与类型层改动，按 NPM 发布流程执行：
  - `pnpm release:version`
  - `pnpm release:publish`
- 如仅做仓库内集成验证，可先执行：
  - `pnpm -C packages/nextclaw-ncp build`
  - `pnpm -C packages/nextclaw-ncp-agent-runtime build`

## 用户/产品视角的验收步骤
1. 安装/引用 `@nextclaw/ncp` 与 `@nextclaw/ncp-agent-runtime`。
2. 在代码中使用 `DefaultNcpAgentRuntime` 组装 runtime，并传入 context builder / model / tool registry。
3. 发送一条最小请求消息，观察事件流是否从 `run.started` 到 `run.finished` 正常闭环。
4. 在会话接口实现中补齐 `deleteSession(sessionId)`，确认会话删除能力可被统一调用。
