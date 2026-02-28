# v0.8.40-chat-event-seq-render

## 迭代完成说明（改了什么）

- Chat 会话存储改为**单写事件日志**（append-only event jsonl），不再以 message 行作为持久化主格式。
- `SessionManager` 新增事件模型（`seq/type/timestamp/data`）并保持 `session.messages` 投影兼容，支持从历史 message jsonl 自动投影迁移。
- Agent/UI 流式链路打通 `session_event`：
  - runtime 在写入 user / assistant(tool_call) / tool(result) / assistant(final) 时同步推送事件。
  - `/api/chat/turn/stream` 新增 `event: session_event` SSE 帧。
- Chat 前端渲染从“消息后处理合并”切换为“事件时间线渲染”：
  - 按 `seq` 保序渲染。
  - 工具调用结果按 `callId` 依附到调用卡片。
  - 工具结果后的紧随 assistant 文本/思考并入同一 assistant flow 卡片。
- 保留真实文本流式（`delta`），并与 `session_event` 并行工作。

关键文件：

- `packages/nextclaw-core/src/session/manager.ts`
- `packages/nextclaw-core/src/agent/loop.ts`
- `packages/nextclaw/src/cli/commands/agent-runtime-pool.ts`
- `packages/nextclaw/src/cli/commands/service.ts`
- `packages/nextclaw-server/src/ui/types.ts`
- `packages/nextclaw-server/src/ui/router.ts`
- `packages/nextclaw-server/src/ui/config.ts`
- `packages/nextclaw-ui/src/api/types.ts`
- `packages/nextclaw-ui/src/api/config.ts`
- `packages/nextclaw-ui/src/lib/chat-message.ts`
- `packages/nextclaw-ui/src/components/chat/ChatThread.tsx`
- `packages/nextclaw-ui/src/components/chat/ChatPage.tsx`

## 测试 / 验证 / 验收方式

已执行：

- 定向 TypeScript 验证：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-core tsc`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-server tsc`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui tsc`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw tsc`
- 定向 lint：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-core lint`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-server lint`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui lint`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw lint`
- 定向 build：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-core build`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-server build`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui build`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw build`
- 全量发布前校验：
  - `PATH=/opt/homebrew/bin:$PATH pnpm build`
  - `PATH=/opt/homebrew/bin:$PATH pnpm lint`
  - `PATH=/opt/homebrew/bin:$PATH pnpm tsc`

冒烟（非仓库目录/隔离数据）：

- 事件存储冒烟（`NEXTCLAW_HOME=/tmp/...`）：
  - 用 `SessionManager` 写入 user / assistant(tool_call) / tool(result) / assistant(final)。
  - 验证：events=4、messages 投影=4、seq 连续为 `1,2,3,4`、session 文件存在 `_type:event` 记录。
- 前端时间线合并冒烟：
  - 用 `buildChatTimeline` 输入 tool_call -> tool_result -> followup assistant 样例。
  - 验证：时间线长度为 2（user + assistant_flow）、tool result 合并到同卡、followup 文本并入同卡。
- 路由测试：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-server test src/ui/router.chat.test.ts`
  - 结果：5/5 通过。

## 发布 / 部署方式

按发布闭环执行：

1. `PATH=/opt/homebrew/bin:$PATH pnpm release:version`
2. `PATH=/opt/homebrew/bin:$PATH pnpm release:publish`

本轮发布结果：

- `nextclaw@0.8.40`
- `@nextclaw/core@0.6.37`
- `@nextclaw/server@0.5.20`
- `@nextclaw/ui@0.5.28`

## 用户 / 产品视角的验收步骤

1. 启动：`nextclaw start`
2. 打开 UI Chat 页面并发起会触发工具调用的请求。
3. 观察回答流：
   - 工具调用与结果在同一卡片内。
   - 工具结果后 assistant 的解释文本仍在同一卡片。
   - thinking/工具/正文按事件发生顺序展示，不再被挪到卡片末尾。
4. 在 AI 回复过程中继续输入并发送，确认输入与发送不中断。
5. 进入会话历史接口（或刷新页面），确认历史可稳定复现同样顺序与合并效果。

## 文档影响检查

- 已检查：本次改动不引入新的用户命令入口，`docs/USAGE.md` 无需新增章节（仅由构建流程同步模板）。
- 项目内文档引用未新增纯文本路径引用。
