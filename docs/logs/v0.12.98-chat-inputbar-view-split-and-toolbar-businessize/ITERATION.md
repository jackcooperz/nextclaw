# Iteration v0.12.98-chat-inputbar-view-split-and-toolbar-businessize

## 迭代完成说明（改了什么）
- 将 `ChatInputBarView.tsx` 从“大文件混合职责”拆分为编排层：
  - 只负责组合队列区、输入区、Slash 面板、模型提示、已选技能、底部工具栏。
- 新增纯展示组件（独立文件）：
  - `ChatInputQueueSection.tsx`
  - `ChatInputSlashPanelSection.tsx`
  - `ChatInputModelStateHint.tsx`
  - `ChatInputSelectedSkillsSection.tsx`
  - `bottom-toolbar/ChatInputAttachButton.tsx`
  - `bottom-toolbar/ChatInputSessionTypeSelector.tsx`
  - `bottom-toolbar/ChatInputModelSelector.tsx`
  - `bottom-toolbar/ChatInputSendControls.tsx`
- 新增业务组件 `ChatInputBottomToolbar.tsx`：
  - 直接消费 `presenter + chat-input store`，不再通过上层 props 透传业务动作。
- 收敛 `useChatInputBarController.ts` 职责：
  - 仅负责队列/Slash/键盘行为与已选技能映射。
  - 移除模型/会话类型/停止提示等与底部工具栏相关的派生逻辑。
- 新增共享类型文件 `chat-input.types.ts`：
  - `ChatModelOption`
  - `ChatInputBarSlashItem`

## 测试/验证/验收方式
- 类型检查：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui tsc --noEmit`
- ESLint（受影响文件）：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui exec eslint src/components/chat/chat-input/ChatInputBarView.tsx src/components/chat/chat-input/ChatInputBottomToolbar.tsx src/components/chat/chat-input/useChatInputBarController.ts src/components/chat/chat-input.types.ts src/components/chat/chat-input/components/ChatInputQueueSection.tsx src/components/chat/chat-input/components/ChatInputSlashPanelSection.tsx src/components/chat/chat-input/components/ChatInputSelectedSkillsSection.tsx src/components/chat/chat-input/components/ChatInputModelStateHint.tsx src/components/chat/chat-input/components/bottom-toolbar/ChatInputAttachButton.tsx src/components/chat/chat-input/components/bottom-toolbar/ChatInputSessionTypeSelector.tsx src/components/chat/chat-input/components/bottom-toolbar/ChatInputModelSelector.tsx src/components/chat/chat-input/components/bottom-toolbar/ChatInputSendControls.tsx src/components/chat/ChatConversationPanel.tsx`
- UI 构建：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C . build:ui`

## 发布/部署方式
- 本次仅前端结构重构，不涉及后端和数据库。
- 按常规前端发布流程部署 UI 包即可，无 migration。

## 用户/产品视角的验收步骤
1. 在 Chat 页面输入消息并回车发送，确认输入区行为正常。
2. 验证队列区：排队提示、展开/收起、编辑、置顶、删除都正常。
3. 输入 `/` 验证 Slash 面板：检索、上下键切换、回车选中技能正常。
4. 验证底部工具栏：技能选择、会话类型切换、模型切换、发送/停止按钮行为与改造前一致。
5. 在无模型场景下确认“去配置 Provider”提示与跳转正常。
