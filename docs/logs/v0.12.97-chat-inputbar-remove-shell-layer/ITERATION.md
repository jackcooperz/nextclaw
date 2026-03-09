# Iteration v0.12.97-chat-inputbar-remove-shell-layer

## 迭代完成说明（改了什么）
- 删除无意义组件壳层：移除 `ChatInputBar.tsx`（仅 `return <ChatInputBarView />` 的中间层）。
- `ChatConversationPanel` 改为直接渲染 `ChatInputBarView`，去掉一层组件跳转。
- 将原 `ChatInputBar.tsx` 内共享类型下沉到独立文件 `chat-input.types.ts`：
  - `ChatModelOption`
- 更新相关类型引用：
  - `chat-page-data.ts`
  - `chat-page-runtime.ts`
  - `stores/chat-thread.store.ts`

## 测试/验证/验收方式
- 类型检查：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui tsc --noEmit`
- ESLint（受影响文件）：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui exec eslint src/components/chat/ChatConversationPanel.tsx src/components/chat/chat-page-data.ts src/components/chat/chat-page-runtime.ts src/components/chat/stores/chat-thread.store.ts src/components/chat/chat-input.types.ts`
- UI 构建：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C . build:ui`

## 发布/部署方式
- 本次仅为前端架构收敛与引用调整，无后端/数据库变更。
- 按常规前端发布流程执行即可（无需 migration）。

## 用户/产品视角的验收步骤
1. 打开 Chat 页面，确认输入区正常显示。
2. 新建会话并发送消息，确认发送、停止、队列、slash、技能选择、模型切换行为与改造前一致。
3. 切换不同会话后再返回，确认输入区行为无回归。
