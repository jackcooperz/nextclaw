# Nextclaw 核心架构

本文档描述 nextclaw 核心部分的架构：包划分、数据流与关键抽象。

---

## 1. 包与分层

```
packages/
├── nextclaw-core (@nextclaw/core)     # 核心运行时：Agent、通道、总线、配置、Provider
├── nextclaw (CLI)                     # 进程入口：CLI、Gateway 编排、服务启动
├── nextclaw-server (@nextclaw/server) # HTTP/WebSocket 服务（UI 后端）
├── nextclaw-ui (@nextclaw/ui)         # 前端 UI
├── nextclaw-openclaw-compat           # OpenClaw 插件/通道兼容层
└── extensions/
    ├── nextclaw-channel-runtime        # 通道运行时（与 openclaw 插件对接）
    ├── nextclaw-engine-plugin-codex-sdk
    └── nextclaw-engine-plugin-claude-agent-sdk
```

- **nextclaw-core**：无 CLI、无 HTTP，只提供 Agent 引擎、消息总线、通道管理、配置与 LLM Provider。可被 CLI、Server、Desktop 等复用。
- **nextclaw**：CLI 入口 + Gateway 进程。负责创建 `MessageBus`、`ChannelManager`、`ProviderManager`、`GatewayAgentRuntimePool`，启动通道与 Agent 消费循环，以及配置重载、Cron、Heartbeat、插件网关等。

---

## 2. 消息流总览

```
  [ 各渠道 ]  ──►  Channel (BaseChannel)  ──►  bus.publishInbound(msg)
                                                      │
                                                      ▼
  GatewayAgentRuntimePool.run()  ◄────  bus.consumeInbound()
        │
        ├── AgentRouteResolver.resolveInbound()  → 选 agentId / sessionKey
        ├── resolveRuntime(agentId)              → 取对应 AgentEngine
        └── engine.handleInbound({ message, sessionKey, publishResponse })
                      │
                      ▼
  AgentLoop.handleInbound()  →  processMessage()  →  LLM + Tools
                      │
                      └── bus.publishOutbound(response)
                                    │
                                    ▼
  ChannelManager.dispatchOutbound()  ◄────  bus.consumeOutbound()
        │
        └── channel.send(msg)  ──►  [ 各渠道 ] 推送给用户
```

- **入站**：渠道实现（如飞书、Discord、CLI）继承或适配 `BaseChannel`，收到用户消息后调用 `bus.publishInbound(InboundMessage)`。
- **消费入站**：`GatewayAgentRuntimePool.run()` 中 `bus.consumeInbound()` 取消息，经 `AgentRouteResolver` 解析出 `agentId` 和 `sessionKey`，再交给对应 `AgentEngine.handleInbound()`。
- **出站**：Agent 在 `AgentLoop` 内调用 `bus.publishOutbound(OutboundMessage)`；`ChannelManager` 在 `dispatchOutbound()` 里 `bus.consumeOutbound()` 并按 `msg.channel` 分发给对应 `BaseChannel.send()`。

---

## 3. 核心抽象（nextclaw-core）

### 3.1 消息总线 `MessageBus`（`bus/queue.ts`）

- **Inbound**：`publishInbound(InboundMessage)`、`consumeInbound()`，单消费者（Gateway 主循环）。
- **Outbound**：`publishOutbound(OutboundMessage)`、`consumeOutbound()`；`ChannelManager` 单循环消费并按 `channel` 分发。
- 另有 `subscribeOutbound(channel, callback)`，当前主要用于内部控制消息（如 typing stop），主出站路径仍是 `consumeOutbound` + `deliver()`。

### 3.2 事件类型（`bus/events.ts`）

- **InboundMessage**：`channel`, `senderId`, `chatId`, `content`, `timestamp`, `attachments`, `metadata`。
- **OutboundMessage**：`channel`, `chatId`, `content`, `replyTo`, `media`, `metadata`。
- `inboundSessionKey(msg)` => `channel:chatId`，用作会话键。

### 3.3 引擎接口 `AgentEngine`（`engine/types.ts`）

- **kind**：引擎类型，如 `"native"`。
- **handleInbound(params)**：处理一条入站消息，可选将回复通过 bus 发出。
- **processDirect(params)**：直接处理一段文本（CLI / Cron / 插件桥），返回回复字符串。
- **applyRuntimeConfig(config)**：应用运行时配置变更。

`NativeAgentEngine`（`engine/native.ts`）是默认实现，内部委托给 `AgentLoop`。

### 3.4 Agent 循环 `AgentLoop`（`agent/loop.ts`）

- 持有：`ContextBuilder`、`SessionManager`、`ToolRegistry`、`SubagentManager`、`InputBudgetPruner`、扩展工具等。
- **handleInbound**：解析 session、构建上下文、调用 `processMessage()`；若 `publishResponse` 则将 `OutboundMessage` 写入 bus。
- **processMessage**：拉取/创建 Session、决定 model、加载 skills、构建 messages、调用 Provider chat completions、执行 tool calls（可多轮），最后返回一条 `OutboundMessage`。
- **processDirect**：构造虚拟 `InboundMessage`，走 `processMessage`，返回 `response.content`。
- 内置工具：文件读写/编辑、shell、web 搜索/抓取、message、sessions、memory、gateway、cron、subagents 等；扩展通过 `ExtensionToolAdapter` 注册。

### 3.5 路由 `AgentRouteResolver`（`agent/route-resolver.ts`）

- **resolveInbound({ message, forcedAgentId?, sessionKeyOverride? })**：根据配置与 `message`（channel、chatId、metadata 等）决定 `agentId`、`accountId`、`sessionKey`、`peer`。
- 支持多 Agent 配置（`config.agents.list`）、binding、默认 agent。

### 3.6 通道 `BaseChannel` / `ChannelManager`（`channels/`）

- **BaseChannel**：抽象类，`start()`、`stop()`、`send(OutboundMessage)`；子类在收到用户消息时调用 `handleMessage()`，内部会 `bus.publishInbound(...)`。
- **ChannelManager**：持有多个 `BaseChannel`（含扩展通过 `ExtensionChannelAdapter` 或 `nextclaw.createChannel` 注册的）；`startAll()` 启动所有通道并启动 `dispatchOutbound()` 循环；`deliver(msg)` 根据 `msg.channel` 找到通道并 `channel.send()`，并在发送前做静默回复策略、内容清理等。

### 3.7 会话 `SessionManager`（`session/manager.ts`）

- 按 `sessionKey`（如 `channel:chatId`）管理会话：`getOrCreate(key)` 返回 `Session`（messages、events、metadata）。
- 持久化到 `getSessionsPath()` 下的 JSONL 文件；Agent 读历史、追加消息、写回。

### 3.8 配置与 Provider

- **Config**：Zod schema（`config/schema.ts`），含 agents、channels、tools、ui 等；`loadConfig()` / `saveConfig()` 基于 `getConfigPath()`。
- **ProviderManager**：按 model 路由到对应 LLM Provider（如 LiteLLM）；`get(model)` 返回 `LLMProvider`，供 AgentLoop 调用 chat completions。
- **CronService**、**HeartbeatService**：定时任务与心跳，可向 `processDirect` 投递内容。

---

## 4. Gateway 进程编排（nextclaw CLI）

- **ServiceCommands.startGateway()**（`cli/commands/service.ts`）：
  1. 加载 config、解析 secrets、初始化 `MessageBus`、`ProviderManager`、`SessionManager`、`CronService`。
  2. 构建 `extensionRegistry`（tools / channels / engines）来自插件（openclaw-compat）。
  3. 创建 `ChannelManager(config, bus, sessionManager, extensionRegistry.channels)`。
  4. 创建 `GatewayControllerImpl`（重载、重启、cron、session 等给 gateway 工具用）。
  5. 创建 **GatewayAgentRuntimePool**（bus、providerManager、sessionManager、config、cron、gatewayController、extensionRegistry、resolveMessageToolHints 等）。
  6. 将 `reloader.setApplyAgentRuntimeConfig` 指向 `runtimePool.applyRuntimeConfig`；插件重载时更新 `extensionRegistry` 并 `runtimePool.applyExtensionRegistry`。
  7. 启动插件通道网关、`channelManager.startAll()`（内部启动 `dispatchOutbound` 循环）、`runtimePool.run()`（`consumeInbound` → 路由 → `engine.handleInbound`）。
  8. 可选启动 UI 服务、Cron、Heartbeat；监听 config 文件变更触发 reload。

- **GatewayAgentRuntimePool**（`cli/commands/agent-runtime-pool.ts`）：
  - 根据 `config.agents.list` 为每个 agent profile 创建一个 **AgentEngine**（默认 `NativeAgentEngine`，或通过 `extensionRegistry.engines` 的 factory 创建）。
  - **run()**：循环 `bus.consumeInbound()` → `routeResolver.resolveInbound()` → `resolveRuntime(route.agentId).engine.handleInbound(...)`。
  - **processDirect()**：构造 `InboundMessage`，解析路由，调用对应 `engine.processDirect()`，用于 CLI、Cron、插件桥、心跳等。

---

## 5. 扩展点（nextclaw-core）

- **ExtensionRegistry**（`extensions/types.ts`）：`tools`、`channels`、`engines`、`diagnostics`。
  - **tools**：`ExtensionToolRegistration[]`，由 `ExtensionToolAdapter` 在 AgentLoop 中注册到 `ToolRegistry`。
  - **channels**：`ExtensionChannelRegistration[]`，由 `ChannelManager` 实例化为 `BaseChannel` 或 `ExtensionChannelAdapter`。
  - **engines**：`ExtensionEngineRegistration[]`，每个提供 `AgentEngineFactory`；RuntimePool 在按 profile 创建引擎时，若 `engine !== "native"` 则从 registry 取 factory 创建，失败则回退 native。

- **AgentEngineFactory**：`(context: AgentEngineFactoryContext) => AgentEngine`，context 含 bus、providerManager、sessionManager、config、gatewayController、extensionRegistry 等，便于插件实现自己的推理循环（如 Codex / Claude Agent SDK）。

---

## 6. 小结

| 层次       | 职责 |
|------------|------|
| **nextclaw-core** | 消息总线、Inbound/Outbound 类型、AgentEngine 接口与 Native 实现、AgentLoop（上下文 + 工具 + LLM）、路由、通道抽象与管理、会话、配置、Provider。 |
| **nextclaw (CLI)** | 创建并连接 bus / channels / providers / session / cron；维护 RuntimePool（多 AgentEngine）；运行 consumeInbound 主循环与 dispatchOutbound；配置与插件重载；Gateway 工具、UI 服务、Cron、Heartbeat。 |
| **扩展**   | 通过 ExtensionRegistry 注入 tools、channels、engines；openclaw-compat 将 OpenClaw 插件适配为 ExtensionRegistry 并启动插件侧网关。 |

整体是**单进程、单总线、多通道、多 Agent 实例**：一条入站队列被 RuntimePool 顺序消费并按路由分发到不同 AgentEngine，出站队列由 ChannelManager 顺序消费并按 channel 分发到对应通道发送。
