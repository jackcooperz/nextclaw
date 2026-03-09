# v0.12.96 chat inputbar collapse middle layer

## 迭代完成说明（改了什么）
- 去掉 `ChatInputBar.tsx` 到 `ChatInputBarView` 的大规模属性透传，`ChatInputBar.tsx` 仅保留入口壳。
- 去掉 `ChatInputBarView -> ChatInputBarPureView` 中间层透传，合并为单一业务组件实现。
- `ChatInputBarView` 直接读取 presenter/store，并直接调用 `useChatInputBarController`，不再经过额外包装层。

## 测试/验证/验收方式
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui tsc --noEmit`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui exec eslint src/components/chat/ChatInputBar.tsx src/components/chat/chat-input/ChatInputBarView.tsx src/components/chat/chat-input/useChatInputBarController.ts`
- `PATH=/opt/homebrew/bin:$PATH pnpm build:ui`

## 发布/部署方式
- 本次为前端结构收敛，无额外发布动作。
- 如需发布，按既有前端发布流程执行并补冒烟记录。

## 用户/产品视角的验收步骤
1. 打开 chat 页面，确认输入区正常渲染。
2. 验证发送、停止、排队、slash、技能选择行为与改造前一致。
3. 验证模型/会话类型选择与错误提示展示正常。
