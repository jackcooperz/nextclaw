# v0.12.84-chat-input-presentation-controller-split

## 1) 迭代完成说明（改了什么）
- 将 `ChatInputBar` 从“单文件混合逻辑+UI”拆分为三层：
  - 容器接线层：`src/components/chat/ChatInputBar.tsx`
  - 控制器层（状态/交互编排）：`src/components/chat/chat-input/useChatInputBarController.ts`
  - 纯展示层（无业务状态管理）：`src/components/chat/chat-input/ChatInputBarView.tsx`
- `slash` 面板的视觉结构与 className 保持原样，仅迁移到展示层组件。
- 队列操作按钮（编辑/置顶/删除）的行为和样式回归到原实现（`ArrowUp` + disabled 语义）。

## 2) 测试/验证/验收方式
- ESLint（目标文件）
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui exec eslint src/components/chat/ChatInputBar.tsx src/components/chat/chat-input/ChatInputBarView.tsx src/components/chat/chat-input/useChatInputBarController.ts`
- TypeScript 检查
  - `PATH=/opt/homebrew/bin:$PATH pnpm tsc:ui`
- 构建验证
  - `PATH=/opt/homebrew/bin:$PATH pnpm build:ui`
- UI 冒烟
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui preview --host 127.0.0.1 --port 4175`
  - `curl http://127.0.0.1:4175/ | head`

## 3) 发布/部署方式
- 本轮未执行发布。
- 若仅发布前端，沿用项目既有 `/release-frontend` 流程。

## 4) 用户/产品视角的验收步骤
1. 在 Chat 输入框输入 `/`，确认 slash 面板展示、高亮切换和详情区样式与改动前一致。
2. 输入时按 `↑/↓` 选择、`Enter/Tab` 选中、`Esc` 关闭，确认交互行为一致。
3. 运行中连续发送，观察队列面板中编辑/置顶/删除按钮行为与改动前一致。
4. 无运行时发送消息，确认发送、回复、停止按钮状态与原行为一致。
