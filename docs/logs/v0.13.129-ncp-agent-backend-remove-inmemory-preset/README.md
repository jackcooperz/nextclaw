# v0.13.129-ncp-agent-backend-remove-inmemory-preset

## 迭代完成说明

- 删除 `@nextclaw/ncp-toolkit` 中的 `DefaultNcpInMemoryAgentBackend` 与 `DefaultNcpInMemoryAgentBackendConfig`
- 保留 `DefaultNcpAgentBackend` 作为唯一推荐 backend 入口，要求调用方显式注入 `sessionStore`、`runStore`、`controllerRegistry`
- 将 `apps/ncp-demo/backend` 改为使用 `DefaultNcpAgentBackend + InMemoryAgentSessionStore + InMemoryAgentRunStore + InMemoryRunControllerRegistry`
- 更新 toolkit README 与设计文档，统一为“通用 backend core + in-memory adapters”的表述
- 调整测试，取消对 `DefaultNcpInMemoryAgentBackend` 的依赖，改为验证 `DefaultNcpAgentBackend` 在 in-memory adapters 下的行为

## 测试/验证/验收方式

- `cd packages/ncp-packages/nextclaw-ncp-toolkit && pnpm test`
- `cd packages/ncp-packages/nextclaw-ncp-toolkit && pnpm tsc`
- `cd packages/ncp-packages/nextclaw-ncp-toolkit && pnpm lint`
- `cd packages/ncp-packages/nextclaw-ncp-toolkit && pnpm build`
- `pnpm --filter @nextclaw/ncp-demo-backend build`

验收重点：

- toolkit 根导出不再暴露 `DefaultNcpInMemoryAgentBackend`
- demo backend 可显式组装并完成编译
- `DefaultNcpAgentBackend` 在 in-memory adapters 组合下仍支持消息发送、run replay、abort

## 发布/部署方式

- 本次为库 API 收口与 demo 适配，按常规 NPM 包发布流程处理
- 若对外发布 `@nextclaw/ncp-toolkit`，需要在 release notes 中明确说明 `DefaultNcpInMemoryAgentBackend` 已移除，推荐迁移到 `DefaultNcpAgentBackend`
- 远程 migration 不适用，因为未涉及后端数据库变更

## 用户/产品视角的验收步骤

1. 在业务代码中从 `@nextclaw/ncp-toolkit` 导入 `DefaultNcpAgentBackend`
2. 显式创建 `InMemoryAgentSessionStore`、`InMemoryAgentRunStore`、`InMemoryRunControllerRegistry`
3. 将这些 adapters 与 `createRuntime` 一起传给 `DefaultNcpAgentBackend`
4. 发送消息并确认 session 列表、消息列表、run replay、abort 正常工作
5. 搜索项目代码，确认不再依赖 `DefaultNcpInMemoryAgentBackend`
