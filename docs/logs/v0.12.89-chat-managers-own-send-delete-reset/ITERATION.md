# v0.12.89 Chat Managers Own Send/Delete/Reset

## 迭代完成说明（改了什么）
- 将发送流程下沉到 `ChatInputManager.send()`：直接从 store 读取 `draft/selectedModel/selectedSkills/selectedSessionKey/selectedAgentId`，组装 payload，清空 `draft/skills`，并调用发送。
- 新增 `ChatUiManager`（路由能力集中），并通过 constructor 注入给各 manager。
- 删除 `ChatPresenter` 的转发包装（`syncRouter/syncState/bindActions`），页面改为直接调用对应 manager。
- 将“删除会话确认+执行+清理+导航+刷新”下沉到 `ChatThreadManager`。
- 将“新会话重置流程”下沉到 `ChatSessionListManager.createSession()`。
- 将“编辑队列消息回填草稿”下沉到 `ChatInputManager.editQueuedMessage()`。
- 抽出会话路由工具到 `chat-session-route.ts`，降低 `ChatPage` 内聚合函数数量。
- 清理 `ChatPage` 中对 `draft/selectedModel/selectedSkills/pendingSessionType` 的冗余回灌，保持这些状态由 store+manager 自治。
- 清理 `ChatPage` 内对 manager 方法的本地别名，统一直接调用 `presenter.xxxManager.xxx`。
- 新增 `ChatStreamManager`，`useChatStreamController` 改为使用 manager 封装（内部仍复用 runtime controller，行为不变）。
- `ChatStreamManager` 上移为 `ChatPresenter` 持有，`ChatPage` 不再透出/持有 `streamManager` 变量，统一通过 `presenter.chatStreamManager.xxx` 访问。
- `ChatInputManager`、`ChatSessionListManager`、`ChatThreadManager` 进一步改为“manager 直连 manager”（constructor 注入），移除 manager 之间的函数绑定转发。
- `handleSelectedSessionTypeChange` 下沉到 `ChatInputManager.selectSessionType()`，页面不再承载这段业务更新逻辑。
- `confirm` 能力并入 `ChatUiManager`，`ChatThreadManager` 删除流程通过 `uiManager.confirm()` 触发；`ChatUiManager` 内部明确区分 `syncState`（如 `pathname`）与 `bindActions`（如 `navigate/confirm`）。
- 将 `chat-stream/controller.ts` 中多个“会修改状态/流程控制”的导出函数收敛到 `ChatStreamFlowController` class，由 `ChatStreamRuntimeController` 通过 class 方法调用，减少函数式工具散落。

## 测试/验证/验收方式
- 类型检查：`PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui tsc --noEmit`
- 受影响文件 lint：
  `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui exec eslint src/components/chat/ChatPage.tsx src/components/chat/managers/chat-input.manager.ts src/components/chat/managers/chat-session-list.manager.ts src/components/chat/managers/chat-thread.manager.ts src/components/chat/managers/chat-ui.manager.ts src/components/chat/presenter/chat.presenter.ts src/components/chat/stores/chat-input.store.ts src/components/chat/chat-session-route.ts`
- 构建验证：`PATH=/opt/homebrew/bin:$PATH pnpm build:ui`
- 冒烟（可运行）：`PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui preview --host 127.0.0.1 --port 4173`，确认可启动后停止。

## 发布/部署方式
- 本次为前端结构重构与逻辑下沉，无发布命令变更。
- 沿用既有前端发布流程（如需正式发布，执行项目既有 UI 发布命令链）。

## 用户/产品视角的验收步骤
1. 进入聊天页，输入消息并发送：消息应立即进入发送流程，首条消息不应卡在页面 helper 逻辑。
2. 在运行中再次发送：应按“中断并发送”策略继续（由发送层策略控制）。
3. 点击队列消息“编辑”：应回填到输入框并从队列移除。
4. 点击“新建会话”：应清空当前会话选择并回到聊天根路径。
5. 删除当前会话：应出现确认弹窗，确认后会话删除并返回聊天根路径。
