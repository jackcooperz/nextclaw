# v0.0.16 ChatPage Decompose for Max-Lines Rule

## 迭代完成说明

- 对 `ChatPage` 做拆分与解耦，解决 ESLint 报错：`Function 'ChatPage' has too many lines`。
- 重构动作：
  - 抽离会话状态同步逻辑为 `useChatSessionSync`。
  - 抽离线程自动滚动逻辑为 `useChatThreadScroll`。
  - 抽离页面展示层为 `ChatPageLayout`，`ChatPage` 仅保留状态编排与事件组装。
- 结果：`ChatPage` 函数行数降到规则阈值内（不再出现该警告）。

涉及文件：

- `packages/nextclaw-ui/src/components/chat/ChatPage.tsx`

## 测试/验证/验收方式

### 执行命令

- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui lint`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui tsc`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui build`

### 结果

- `lint`：`ChatPage` 的 `max-lines-per-function` 警告已消失。
- `lint` 仍有仓库既有问题（非本次引入）：
  - `packages/nextclaw-ui/src/components/common/MaskedInput.tsx` 未使用参数。
  - `packages/nextclaw-ui/src/components/config/ProviderForm.tsx` 未使用变量。
  - 其余为既有 `max-lines` 警告。
- `tsc`：通过。
- `build`：通过。

## 发布/部署方式

1. 发布 `@nextclaw/ui`。
2. 发布包含 UI 资源的 `nextclaw`。
3. 重启服务并刷新前端缓存。

## 用户/产品视角的验收步骤

1. 进入 Chat，验证会话切换、发送消息、停止输出、切换技能/定时任务页面行为保持正常。
2. 代码规范侧验收：在本地执行 lint，确认不再出现 `ChatPage` 超行数告警。
