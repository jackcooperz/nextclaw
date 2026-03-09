# v0.12.83-chat-rxjs-runtime-controller-stabilization

## 1) 迭代完成说明（改了什么）
- 将 chat 流式发送运行时从 hook 内多状态拼装，收敛为 class 控制器：`ChatStreamRuntimeController`，使用 `BehaviorSubject` 作为单一状态源。
- `useChatStreamController` 重写为订阅适配层，改为 `useSyncExternalStore` 订阅控制器状态，移除 render 阶段的 `ref.current` 读写（通过 `updateParams` 同步最新参数）。
- 修复运行态退出延迟：`finalizeExecuteSuccess` 中本地 `isSending/activeRunRef` 清理前置，`refetch` 改为后台触发，避免被网络请求阻塞。
- 修复强制发送打断链路卡顿：`stopActiveRun` 改为本地先 `abort`，后端 stop 请求异步补偿，保证队列可快速继续。
- `@nextclaw/ui` 增加 `rxjs` 依赖。

## 2) 测试/验证/验收方式
- 静态检查：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui exec eslint src/components/chat/useChatStreamController.ts src/components/chat/chat-stream/runtime-controller.ts src/components/chat/chat-stream/controller.ts src/components/chat/chat-stream/types.ts src/components/chat/chat-page-runtime.ts src/components/chat/ChatPage.tsx src/hooks/useConfig.ts`
- 类型检查：
  - `PATH=/opt/homebrew/bin:$PATH pnpm tsc:ui`
- 构建验证：
  - `PATH=/opt/homebrew/bin:$PATH pnpm build:ui`
- UI 冒烟：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui preview --host 127.0.0.1 --port 4175`
  - `curl -I http://127.0.0.1:4175/` 或 `curl http://127.0.0.1:4175/ | head`

## 3) 发布/部署方式
- 本次未执行发布。
- 若仅发布前端，按项目既有流程执行 `/release-frontend`。

## 4) 用户/产品视角的验收步骤
1. 打开 Chat 页面，发送第一条消息，确认消息立即显示且进入流式回复。
2. 回复流式进行中再次发送消息，确认会打断当前运行并继续发送新消息，不出现“无法继续发送”的死锁。
3. 回复结束后，确认“运行中”状态能及时退出（不再长时间滞留）。
4. 在未运行状态发送消息，确认不会错误进入缓冲队列。
5. 触发一次停止操作，确认停止按钮状态与后续可发送状态一致。
