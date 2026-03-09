# v0.12.80-chat-stream-controller-layering

## 迭代完成说明（改了什么）
- 在保持用户视角行为不变的前提下，重构聊天流控实现：
  - 新增 `chat-stream/types.ts`：集中流控领域类型（运行态、队列项、流事件、上下文）。
  - 新增 `chat-stream/transport.ts`：统一封装发送流、恢复流、停止请求三类传输调用。
  - 新增 `chat-stream/controller.ts`：集中承载发送策略、运行生命周期、错误恢复、队列策略与停止策略。
  - `useChatStreamController.ts` 调整为薄 Hook，仅负责 React 状态装配与对外接口暴露。
- 保留并验证原有产品行为：
  - 运行中可继续发送，支持抢占（新消息入队头并尝试停止当前 run）。
  - 抢占发送时会始终先本地中断当前流；若后端支持 stop API 则同时发起远端停止请求，进一步对齐 Codex 的“强制发送=先停前一轮再发新一轮”体感。
  - 队列可视化与队列操作（删除、置顶）保持可用。
  - 流式显示、会话刷新、错误回填草稿等行为保持一致。
- 增加发送竞态防护（不改变用户行为）：
  - 发送策略由“仅依赖 `isSending`”升级为“`isSending` + `activeRunRef` 双重判定”，避免极短时间连发时落入状态同步窗口。
  - 恢复运行逻辑增加 `activeRunRef` 守卫，避免存在活动流时重复发起恢复流。
- 修复本轮重构引入的一个 lint 问题：移除 `controller.ts` 未使用类型导入。

## 测试/验证/验收方式
- 影响面判定：本次触达 UI 可运行行为与流控逻辑，执行 UI 侧最小充分验证（eslint 定向 + tsc + build + 冒烟）。
- 已执行并通过：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui exec eslint src/components/chat/useChatStreamController.ts src/components/chat/chat-stream/types.ts src/components/chat/chat-stream/transport.ts src/components/chat/chat-stream/controller.ts`
  - `PATH=/opt/homebrew/bin:$PATH pnpm tsc:ui`
  - `PATH=/opt/homebrew/bin:$PATH pnpm build:ui`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui preview --host 127.0.0.1 --port 4175` + `curl http://127.0.0.1:4175/`（页面含 `<div id="root"></div>`）
- 额外检查：
  - `PATH=/opt/homebrew/bin:$PATH pnpm lint:ui` 未通过，失败来自仓库既有问题（`src/components/common/MaskedInput.tsx` 未使用参数），非本次改动引入。

## 发布/部署方式
- 本次为前端流控与交互重构，发布按 UI 流程执行：
  - `pnpm release:frontend`
- 若仅本地验证，可不执行发布步骤。

## 用户/产品视角的验收步骤
1. 进入聊天页，发送一条消息让会话处于运行中。
2. 在运行中继续发送新消息，确认可以发出且新消息被优先处理（会触发中断当前运行并发送新消息）。
3. 连续发送多条消息，确认“待发送队列”可见且顺序正确。
4. 对队列项执行“置顶/删除”，确认队列顺序与数量即时更新。
5. 制造一次发送错误（例如临时断开后端），确认错误可见且草稿回填策略不回归。
