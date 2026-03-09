# ChatPage 重构两条原则

## 原则一：数据查询统一拆分到独立模块

1. `ChatPage.tsx` 不直接堆叠 query hooks 与派生计算。
2. 所有 chat 页面查询与数据派生统一收敛到 `chat-page-data.ts`。
3. 页面层只消费聚合后的数据视图对象，减少依赖数组和编排复杂度。

## 原则二：状态写入统一由 Manager 负责

1. `setDraft`、`setSelectedModel`、`setSelectedSkills`、`setSelectedSessionKey`、`setPendingSessionType` 等状态写入入口只保留在 manager。
2. 页面和业务组件直接调用 `presenter.xxxManager.xxx`，不再在页面层定义重复的 `setX` 包装器。
3. UI 层仅读 store、调 manager，不再承担状态变更细节。

## 目标

1. 降低 ChatPage 的认知负担与改动半径。
2. 提升模块可测试性和可复用性。
3. 减少 props 透传与回调连接复杂度。
