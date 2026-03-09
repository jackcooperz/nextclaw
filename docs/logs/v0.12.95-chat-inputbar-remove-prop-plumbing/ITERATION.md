# v0.12.95 chat inputbar remove prop plumbing

## 迭代完成说明（改了什么）
- 去掉 `ChatInputBar.tsx` 大量属性透传（prop plumbing）。
- 将 presenter/store 读取与参数拼装下沉到 `useChatInputBarViewProps()`，由业务层 hook 直接访问 presenter 与 store。
- `ChatInputBar.tsx` 收敛为薄编排壳：仅获取 `viewProps` 并渲染 `ChatInputBarView`。
- 未新增 store，保持现有 manager/store 体系。

## 测试/验证/验收方式
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui tsc --noEmit`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui exec eslint src/components/chat/ChatInputBar.tsx src/components/chat/chat-input/useChatInputBarController.ts`
- `PATH=/opt/homebrew/bin:$PATH pnpm build:ui`

## 发布/部署方式
- 本次为前端结构优化，无额外发布动作。
- 如需发布，按既有前端发布流程执行并补冒烟记录。

## 用户/产品视角的验收步骤
1. 打开 chat 页面，确认输入框、模型选择、技能面板、队列操作可正常使用。
2. 发送/停止/排队操作行为与改造前一致。
3. Slash 交互（上下键、回车、空格关闭）行为保持一致。
