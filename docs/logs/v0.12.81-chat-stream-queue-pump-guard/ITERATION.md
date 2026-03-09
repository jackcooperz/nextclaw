# v0.12.81-chat-stream-queue-pump-guard

## 迭代完成说明（改了什么）
- 在不改变用户视角功能的前提下，增强聊天流控健壮性：
  - `useChatStreamController` 新增队列泵防重入标记 `queuePumpRunningRef`，避免极短时间连续触发 effect 时重复出队发送。
  - 队列消费条件增加 `activeRunRef` 守卫，避免在存在活动流时误触发下一条队列发送。
  - `reset/unmount` 路径统一清理队列泵状态，避免异常路径残留状态。
- 在 `chat-stream/controller.ts` 中继续收敛运行判定：
  - 发送策略由纯 `isSending` 判定升级为 `isSending || activeRunRef.current` 双判定，压缩 UI 状态同步窗口带来的竞态。
  - `resumePendingRun` 增加活动流守卫，避免同一时段重复恢复。
- 与并行改动做最小兼容补齐（不回滚他人变更）：
  - `ChatConversationPanel` 新增的 session-type 必填 props 已在 `ChatPage` 最小接线补齐，确保编译通过，同时保持当前交互行为不变（默认不可编辑，不改变用户路径）。
- 继续收敛 `ChatPage` 结构复杂度（保持功能不变）：
  - 提取模型自动选择同步、运行状态恢复、消息合并为局部 hooks（`useSyncSelectedModel` / `useSessionRunStatus` / `useMergedEvents`）。
  - 提取发送、删除会话、路由跳转、队列回填草稿为纯函数，降低主组件副作用耦合。
  - `ChatPage` 函数行数 warning 已消除（chat 定向 eslint 不再报 `max-lines-per-function`）。

## 测试/验证/验收方式
- 影响面判定：触达 UI 运行态逻辑与 chat 页面参数装配，执行 chat 定向 lint + UI tsc + UI build + 预览冒烟。
- 已执行：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui exec eslint src/components/chat/ChatPage.tsx src/components/chat/useChatStreamController.ts src/components/chat/chat-stream/types.ts src/components/chat/chat-stream/transport.ts src/components/chat/chat-stream/controller.ts src/components/chat/useChatSessionTypeState.ts`
  - `PATH=/opt/homebrew/bin:$PATH pnpm tsc:ui`
  - `PATH=/opt/homebrew/bin:$PATH pnpm build:ui`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui preview --host 127.0.0.1 --port 4175` + `curl http://127.0.0.1:4175/`（页面包含 `<div id="root"></div>`）
  - `PATH=/opt/homebrew/bin:$PATH pnpm lint:ui`
- 结果说明：
  - 定向 eslint 无 error。
  - tsc/build/冒烟均通过。
  - `lint:ui` 仍未通过，失败为仓库既有项（`src/components/common/MaskedInput.tsx` 未使用参数）及若干历史 `max-lines` warning，非本轮 chat 改动引入。

## 发布/部署方式
- 本次为 UI 侧流控健壮性与页面装配收敛，发布沿用前端发布流程：
  - `pnpm release:frontend`
- 若仅本地验证，可不执行发布。

## 用户/产品视角的验收步骤
1. 在聊天页发送一条消息进入运行中。
2. 运行中快速连续发送多条消息，确认不会出现重复发送同一队列项。
3. 在运行中触发“强制发送”（抢占），确认会先中断当前流并优先发送新消息。
4. 在队列存在时执行置顶/删除，确认顺序与数量即时更新。
5. 切换会话后重复上述步骤，确认行为稳定且无回归。
