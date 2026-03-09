# v0.12.88-chat-query-split-and-manager-setters

## 迭代完成说明（改了什么）

1. 新增原则文档：`docs/designs/chat-page-refactor-two-principles.md`，明确两条执行原则：
   - Chat 页面查询与派生统一拆分到独立模块。
   - 状态写入统一走 manager，页面不再维护重复 `setX` 包装器。
2. 新增数据聚合模块：`packages/nextclaw-ui/src/components/chat/chat-page-data.ts`，承接 ChatPage 的 query hooks 与派生数据。
3. `ChatPage.tsx` 调整为直接使用 `presenter.xxxManager.xxx` 写状态：
   - `setSelectedSessionKey`
   - `setSelectedAgentId`
   - `setPendingSessionType`
   - `setDraft`
   - `setSelectedModel`
   - `setSelectedSkills`
4. manager 能力收敛：
   - `chat-input.manager.ts`：新增 `SetStateAction` 兼容写法，集中管理输入相关状态更新。
   - `chat-session-list.manager.ts`：新增 `setSelectedSessionKey`，并支持 `SetStateAction`。
5. 移除过渡复杂层：删除 `chat-command.store.ts` 与 `chat-page-orchestration.ts`。

## 测试/验证/验收方式

1. 类型检查：
   - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui tsc --noEmit`（通过）
2. 受影响文件 ESLint：
   - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui exec eslint src/components/chat/ChatPage.tsx src/components/chat/chat-page-data.ts src/components/chat/managers/chat-input.manager.ts src/components/chat/managers/chat-session-list.manager.ts src/components/chat/presenter/chat.presenter.ts src/components/chat/stores/chat-input.store.ts src/components/chat/stores/chat-session-list.store.ts`（通过，无 error/warning）
3. 构建验证：
   - `PATH=/opt/homebrew/bin:$PATH pnpm build:ui`（通过）

## 发布/部署方式

1. 本次为前端重构迭代，未执行发布。
2. 后续如发布，按 UI 发布流程执行版本提升、构建与冒烟。

## 用户/产品视角的验收步骤

1. 打开聊天页面，验证消息发送、停止、会话切换、新建会话、删除会话流程正常。
2. 验证输入相关状态变更（草稿、模型、技能、会话类型）仍然行为一致。
3. 验证查询相关功能（会话列表、历史消息、技能数据）正常加载并更新。
