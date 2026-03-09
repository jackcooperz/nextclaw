# v0.12.85-chat-mvp-presenter-store-manager

## 1) 迭代完成说明（改了什么）
- 按 MVP 思路在 chat 输入域落地 `presenter-manager-store`：
  - `stores/chat-input.store.ts`：zustand 单例状态源（快照 + 外部绑定）
  - `managers/chat-input.manager.ts`：class action 出口（全箭头函数，无 constructor）
  - `presenter/chat.presenter.ts`：统一挂载 manager
  - `presenter/chat-presenter-context.tsx`：Context Provider + `usePresenter`
- `ChatPage` 增加 presenter provider，并将输入域状态与行为统一同步到 `chat-input.store`。
- `ChatInputBar` 从“props 驱动”改为“直接访问 presenter + store”，业务组件不再依赖上层透传输入域大量 props。
- `ChatConversationPanel` 删除输入条相关 props 透传，直接渲染 `ChatInputBar`。
- 继续保持输入条展示层与逻辑层分离（`ChatInputBarView` 纯展示，`useChatInputBarController` 业务编排）。

## 2) 测试/验证/验收方式
- ESLint（变更文件）
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui exec eslint src/components/chat/ChatPage.tsx src/components/chat/ChatConversationPanel.tsx src/components/chat/ChatInputBar.tsx src/components/chat/chat-input/ChatInputBarView.tsx src/components/chat/chat-input/useChatInputBarController.ts src/components/chat/stores/chat-input.store.ts src/components/chat/managers/chat-input.manager.ts src/components/chat/presenter/chat.presenter.ts src/components/chat/presenter/chat-presenter-context.tsx`
- TypeScript
  - `PATH=/opt/homebrew/bin:$PATH pnpm tsc:ui`
- Build
  - `PATH=/opt/homebrew/bin:$PATH pnpm build:ui`
- UI 冒烟
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui preview --host 127.0.0.1 --port 4175`
  - `curl -I http://127.0.0.1:4175/`

## 3) 发布/部署方式
- 本次未执行发布。
- 前端发布按既有 `/release-frontend` 流程。

## 4) 用户/产品视角的验收步骤
1. 进入 chat，发送消息，确认输入与发送/停止流程与改造前一致。
2. 输入 `/` 验证 slash 面板展示与交互（上下选择、Enter/Tab 选中、Esc 关闭）一致。
3. 运行中连续发送，确认队列显示与编辑/置顶/删除行为一致。
4. 检查模型、会话类型、技能选择仍能生效。
5. 确认无“必须跨多层透传输入条属性”现象（输入域由 presenter/store 直连）。
