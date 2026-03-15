# NCP Agent Backend Storage Decoupling

## Goal

将 `@nextclaw/ncp-toolkit` 里的 agent backend 重构为“通用 backend core + 可插拔存储接口 + 显式组装的 in-memory adapters”。

核心目标：

- `agent-backend` 负责 agent run 编排、事件发布、abort、run replay、session API。
- 持久化层只负责可序列化数据，不绑定具体实现。
- 提供默认的 in-memory adapters，但不再额外包装一个 in-memory backend 预设类。

## Non-goals

本次不解决以下问题：

- 多进程/多实例共享运行时
- 进程崩溃后的 active run 恢复
- 跨节点远程 abort 协调
- 将 `AbortController`、`NcpAgentRuntime` 这类 live object 持久化

这些问题不属于“存储解耦”，而属于分布式 runtime orchestration。

## Recommended Architecture

### 1. Core

`DefaultNcpAgentBackend`

职责：

- 对外提供 `emit`、`send`、`abort`、`stream`
- 提供 `listSessions`、`getSession`、`listSessionMessages`、`deleteSession`
- 维护事件发布器
- 编排 run 执行和持久化落盘时机

### 2. Persistence

`AgentSessionStore`

- 负责 session 快照
- 存储字段：`sessionId`、`messages`、`activeRunId`、`updatedAt`

`AgentRunStore`

- 负责 run record 与 event log
- 支持 `stream()` 的 replay
- 支持 abort 时按 `runId/correlationId/messageId` 反查 run

### 3. Live Runtime

`AgentLiveSessionRegistry`

- 只存在于当前进程
- 保存 `runtime` 和 `stateManager`
- 创建 live session 时从 `AgentSessionStore` hydrate

`RunControllerRegistry`

- 只保存当前进程中的 `AbortController`
- 默认实现为 `InMemoryRunControllerRegistry`

### 4. Adapter Set

默认提供以下 in-memory adapters：

- `InMemoryAgentSessionStore`
- `InMemoryAgentRunStore`
- `InMemoryRunControllerRegistry`

## Why This Split

### 为什么不把所有东西都抽成 store

因为 `NcpAgentRuntime`、`AbortController`、流式执行中的 generator 都是 live runtime，不是可序列化数据。把这些也塞进 store 会让接口设计错误，用户看起来“可以自定义存储”，实际上被迫自己实现 runtime 协调器。

### 为什么 session store 直接存 messages snapshot

因为用户视角最常用的是：

- 列出会话
- 获取会话消息
- 重启后恢复历史消息

直接存 snapshot 能让这些能力和 live runtime 解耦；同时 `runStore` 继续保留 event log，满足 run replay。

## Composition Examples

### Generic backend with custom persistence

```ts
const backend = new DefaultNcpAgentBackend({
  createRuntime: ({ sessionId, stateManager }) => createRuntime({ sessionId, stateManager }),
  sessionStore: new MyDatabaseSessionStore(),
  runStore: new MyDatabaseRunStore(),
});
```

### Generic backend with in-memory adapters

```ts
const backend = new DefaultNcpAgentBackend({
  createRuntime: ({ sessionId, stateManager }) => createRuntime({ sessionId, stateManager }),
  sessionStore: new InMemoryAgentSessionStore(),
  runStore: new InMemoryAgentRunStore(),
  controllerRegistry: new InMemoryRunControllerRegistry(),
});
```

## Current Implementation Notes

- `DefaultNcpAgentBackend` 是新的系统本体。
- in-memory 相关能力通过 adapters 提供，而不是额外包装成 backend 预设类。
- `src/agent/in-memory-agent-backend/index.ts` 仍可作为兼容导出层，但上层推荐直接使用 `DefaultNcpAgentBackend`。

## Extension Guidance

如果后续要接数据库、文件或 HTTP 持久化服务，优先实现以下两个接口：

- `AgentSessionStore`
- `AgentRunStore`

只有当你明确要做多实例运行时协调时，才需要进一步抽象 `AgentLiveSessionRegistry` 和 `RunControllerRegistry` 的跨进程实现。
