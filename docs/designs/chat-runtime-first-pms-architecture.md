# Chat 模块重构设计（Runtime-first + Presenter-Manager-Store）

## 1. 背景与问题

当前 chat 模块存在以下结构性问题：

1. 状态来源过多：React local state、stream runtime state、zustand snapshot、外部 bindings 并存，缺少单一真相。
2. 同步链过长：`ChatPage -> bridge -> sync hooks -> manager -> store`，修改一处常牵连多处。
3. 运行状态不一致：`isSending`、`activeBackendRunId`、轮询 run 状态、局部 suppress 逻辑并存，容易出现 UI 与真实状态脱节。
4. 文件职责混杂：页面编排、路由处理、发送策略、流式生命周期和 UI 细节相互耦合，导致文件和函数超长。

## 2. 目标

1. 架构清晰：每一层只有单一职责，状态流向单向可追踪。
2. 代码精简：删除非必要中间层和重复状态，降低维护成本。
3. 功能不变：保持用户视角行为一致（发送、停止、队列、会话切换、slash、流式回复）。
4. 行为对齐：默认发送策略对齐 Codex/Cursor 风格，运行中发送可触发“先停后发”。

## 3. 非目标

1. 不追求一次性替换全部 UI 组件。
2. 不引入额外大型框架。
3. 不做与 chat 无关模块改造。

## 4. 设计原则

1. Runtime 单一真相：运行生命周期只在 Runtime 层管理。
2. Store 只存数据：zustand store 不再保存外部回调 bindings。
3. Manager 只暴露 action：不承载状态镜像，不做跨层同步胶水。
4. Presenter 统一编排：组件只依赖 Presenter action + Store selector。
5. UI 纯展示：业务计算和生命周期副作用下沉到 Runtime/Manager/Presenter。

## 5. 总体分层

### 5.1 Runtime Core（class + rxjs）

`ChatRuntimeEngine` 负责：

1. `send / stop / resume / queue`。
2. 流式事件聚合（delta/session events）。
3. 运行状态机推进。
4. 对外暴露只读状态流（`state$`）与命令方法。

### 5.2 Store Layer（zustand）

拆分为 4 个 store（单例）：

1. `chat-session.store`：会话列表、选中会话、检索条件。
2. `chat-composer.store`：输入草稿、模型、skills、session type。
3. `chat-thread.store`：消息时间线、滚动相关 UI 状态。
4. `chat-runtime.store`：运行态、队列、活动 run id、错误信息。

### 5.3 Manager Layer（class，箭头函数）

1. `ChatSessionManager`
2. `ChatComposerManager`
3. `ChatThreadManager`
4. `ChatRuntimeManager`

职责：对外暴露动作，不维护状态副本。

### 5.4 Presenter Layer（class）

`ChatPresenter` 持有 managers + runtime + gateway，负责：

1. 初始化订阅：`runtime.state$ -> runtimeStore`。
2. 跨域编排（例如发送前会话保障、停止后切换策略）。
3. 统一提供组件调用入口。

### 5.5 UI / Feature Layer

1. UI 组件：纯展示，基于 props。
2. 业务组件：直接订阅 store（selector）并调用 presenter action。
3. 页面容器：只做装配，不实现业务流程。

## 6. 运行状态机

状态：

1. `idle`
2. `preparing`
3. `streaming`
4. `stopping`
5. `error`（瞬态，随后回到 `idle`）

关键事件：

1. `SEND_REQUESTED`
2. `RUN_READY`
3. `DELTA_RECEIVED`
4. `RUN_FINISHED`
5. `STOP_REQUESTED`
6. `STOP_CONFIRMED`
7. `RUN_FAILED`

约束：

1. `running` UI 判断仅依赖状态机（`preparing|streaming|stopping`）。
2. 轮询 run 状态仅作为兜底校准，不再驱动主状态。

## 7. 发送策略（默认对齐 Codex）

策略枚举：

1. `interrupt-and-send`（默认）：运行中发送 -> 先 stop 当前 run -> 立即发送新消息。
2. `enqueue`（可选）：运行中发送进入队列，等待当前 run 结束。

规则：

1. 第一条缓冲消息允许触发发送。
2. 按钮可用性由状态机统一判断，避免“可点但不生效”。

## 8. 推荐目录结构

```text
src/components/chat/
  runtime/
    chat-runtime.engine.ts
    chat-runtime.machine.ts
    chat-runtime.events.ts
    chat-runtime.gateway.ts
  stores/
    chat-session.store.ts
    chat-composer.store.ts
    chat-thread.store.ts
    chat-runtime.store.ts
  managers/
    chat-session.manager.ts
    chat-composer.manager.ts
    chat-thread.manager.ts
    chat-runtime.manager.ts
  presenter/
    chat.presenter.ts
    chat-presenter-context.tsx
  features/
    chat-page/
    chat-sidebar/
    chat-thread/
    chat-input/
  ui/
    ...pure views
```

## 9. 迁移计划（保持功能不变）

### Phase 1：Runtime 收敛

1. 引入状态机与 `ChatRuntimeEngine`。
2. 将 `send/stop/resume/queue` 全部迁入 Runtime。
3. 接入 `chat-runtime.store`，保证 UI 可读运行真相。

### Phase 2：去中间同步层

1. 删除 bridge/sync hooks/bindings 模式。
2. Presenter 直接写入 stores。
3. Manager 仅保留动作入口。

### Phase 3：页面与组件瘦身

1. `ChatPage` 仅保留装配（路由 + provider + layout）。
2. 输入区和线程区业务逻辑下沉至 manager/runtime。
3. 超长函数拆分，保持小函数单职责。

### Phase 4：清理与回归

1. 删除废弃路径与重复状态。
2. 做全量行为回归（发送/停止/队列/会话切换/slash）。

## 10. 验收标准

1. 不再出现“回复结束但仍运行中”。
2. 不再出现“未运行却进入不可发送队列且无法继续发送”。
3. `ChatPage.tsx` 降至装配层复杂度（目标 < 200 行）。
4. chat 模块 `useEffect` 数量显著下降，且只保留订阅/生命周期必要项。
5. 用户视角功能与交互保持一致。

## 11. 风险与缓解

1. 风险：迁移期间状态来源短暂并存导致回归问题。
   缓解：分阶段迁移，阶段内禁止双写，逐步切流。
2. 风险：停止/恢复的边界条件遗漏。
   缓解：为状态机补事件矩阵测试和 UI 冒烟清单。
3. 风险：历史兼容逻辑残留。
   缓解：Phase 4 明确删除旧路径，不保留双实现。
