# v0.13.128-ncp-agent-backend-storage-decouple

## 迭代完成说明

- 将 `@nextclaw/ncp-toolkit` 的 agent backend 重构为通用 `DefaultNcpAgentBackend`，支持注入 `sessionStore`、`runStore`、`controllerRegistry`
- 新增默认 in-memory 适配器：`InMemoryAgentSessionStore`、`InMemoryAgentRunStore`、`InMemoryRunControllerRegistry`
- 保留 `DefaultNcpInMemoryAgentBackend` 作为开箱即用预设，但其底层已改为组合通用 core
- 调整 `src/agent/index.ts` 导出面，公开新的 backend core 与存储接口类型
- 新增方案文档：[NCP Agent Backend Storage Decoupling](../../designs/ncp-agent-backend-storage-decoupling.md)
- 补充测试，验证通用 backend 可以显式注入 store，且默认 in-memory 预设仍可正常执行与回放

## 测试/验证/验收方式

- `cd packages/ncp-packages/nextclaw-ncp-toolkit && pnpm test`
- `cd packages/ncp-packages/nextclaw-ncp-toolkit && pnpm tsc`
- `cd packages/ncp-packages/nextclaw-ncp-toolkit && pnpm lint`
- `cd packages/ncp-packages/nextclaw-ncp-toolkit && pnpm build`

验收重点：

- `DefaultNcpAgentBackend` 可注入自定义 store 并完成一次完整请求
- `DefaultNcpInMemoryAgentBackend` 仍可完成消息发送、run replay、abort
- 包构建与类型导出正常

## 发布/部署方式

- 本次为库内模块重构，默认按常规包发布流程处理
- 若需要对外发布 `@nextclaw/ncp-toolkit`，按项目既有 NPM 发布闭环执行
- 本次未执行发布，远程 migration 不适用，因为未涉及后端数据库 schema

## 用户/产品视角的验收步骤

1. 在业务代码中使用 `DefaultNcpAgentBackend`，注入自定义 `sessionStore` 与 `runStore`
2. 发送一条用户消息，确认能够收到 `MessageSent`、`RunStarted`、`RunFinished`
3. 调用 `listSessions` 与 `listSessionMessages`，确认消息和会话状态由外部 store 驱动
4. 调用 `stream` 重放某个 `runId`，确认仍能读取历史事件
5. 如需快速跑通，将 backend 换成 `DefaultNcpInMemoryAgentBackend`，确认无需额外存储配置即可工作
