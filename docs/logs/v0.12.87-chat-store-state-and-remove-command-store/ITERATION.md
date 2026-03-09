# v0.12.87-chat-store-state-and-remove-command-store

## 迭代完成说明（改了什么）

1. 删除过渡方案 `chat-command.store.ts` 与 `chat-page-orchestration.ts`，不再通过命令队列转发业务动作。
2. 将 `ChatPage` 中核心状态迁移到 zustand store：
   - `selectedSessionKey`、`selectedAgentId` -> `chat-session-list.store`
   - `pendingSessionType`、`draft`、`selectedModel`、`selectedSkills` -> `chat-input.store`
3. 调整 manager/presenter：
   - `ChatInputManager`、`ChatSessionListManager`、`ChatThreadManager` 去掉 command-store 依赖。
   - `ChatPresenter` 恢复 `bindActions + syncState`，并保持函数为箭头函数。
4. `ChatPage` 改为“store 状态读取 + presenter 同步 + actions 注入”，不再维护上述本地业务 state。

## 测试/验证/验收方式

1. 类型检查：`PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui tsc --noEmit`（通过）。
2. 构建验证：`PATH=/opt/homebrew/bin:$PATH pnpm build:ui`（通过）。
3. Chat 受影响文件 ESLint：
   - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui exec eslint ...`（无 error，`ChatPage` 仍有 `max-lines-per-function` warning，后续继续拆分）。

## 发布/部署方式

1. 本次为前端代码重构迭代，未执行发布。
2. 后续若发布，按既有流程执行 UI 版本发布与冒烟。

## 用户/产品视角的验收步骤

1. 进入 Chat 页面，验证输入、发送、停止、会话切换、删除会话、技能选择、模型切换行为正常。
2. 验证不再存在“command store”机制，状态读取由 store 驱动。
3. 验证发送策略仍保持运行中可中断后发送（不改变用户视角行为）。
