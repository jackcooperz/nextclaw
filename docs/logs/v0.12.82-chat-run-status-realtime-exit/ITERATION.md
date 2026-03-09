# v0.12.82-chat-run-status-realtime-exit

## 迭代完成说明（改了什么）
- 修复“AI 回复结束后，会话状态仍长时间显示运行中”的问题，采用混合机制而非纯轮询：
  - 事件驱动即时退态：当本地 run 从运行态切到非运行态时，对当前会话状态做短时抑制，保证 UI 立即退出“运行中”显示。
  - 轮询兜底校准：`useChatRuns` 在活跃状态查询（`queued/running`）场景启用短轮询，并在无活跃 run 时自动停轮询。
- 将 ChatPage 运行态相关 hook 下沉为独立模块 `chat-page-runtime.ts`，避免页面文件继续膨胀，并保持行为不变。

## 测试/验证/验收方式
- 影响面判定：触达 chat 页面状态同步与 runs 查询策略，执行 chat 定向 lint + UI tsc + UI build + 预览冒烟。
- 已执行：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui exec eslint src/components/chat/ChatPage.tsx src/components/chat/chat-page-runtime.ts src/hooks/useConfig.ts src/components/chat/useChatStreamController.ts src/components/chat/chat-stream/controller.ts src/components/chat/chat-stream/transport.ts src/components/chat/chat-stream/types.ts src/components/chat/useChatSessionTypeState.ts`
  - `PATH=/opt/homebrew/bin:$PATH pnpm tsc:ui`
  - `PATH=/opt/homebrew/bin:$PATH pnpm build:ui`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui preview --host 127.0.0.1 --port 4175` + `curl http://127.0.0.1:4175/`（页面包含 `<div id="root"></div>`）
  - `PATH=/opt/homebrew/bin:$PATH pnpm lint:ui`
- 结果说明：
  - 定向 eslint / tsc / build / 冒烟均通过。
  - `lint:ui` 仍受仓库既有问题影响（`src/components/common/MaskedInput.tsx` 未使用参数 error + 若干历史 max-lines warning），非本次改动引入。

## 发布/部署方式
- 本次为 UI 行为修复，发布沿用前端流程：
  - `pnpm release:frontend`
- 若仅本地验证，可不执行发布。

## 用户/产品视角的验收步骤
1. 在聊天页发送一条消息，观察会话状态进入“运行中”。
2. 等待助手回复完成，确认状态基本即时退出“运行中”（不再出现明显长延迟）。
3. 在网络抖动场景重复测试，确认状态可在短轮询兜底下收敛到真实状态。
4. 连续发送多条消息并触发抢占，确认状态切换与队列行为保持一致。
