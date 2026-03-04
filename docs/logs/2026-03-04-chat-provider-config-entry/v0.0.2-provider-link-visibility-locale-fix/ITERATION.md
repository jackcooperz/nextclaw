# v0.0.2 Provider Link Visibility and Locale Fix

## 迭代完成说明

- 修复“无 Provider 场景看不到跳转入口”的问题：
  - 在聊天欢迎态之外，新增顶部警示条，始终显示“去配置提供商”入口。
- 修复文案本地化不一致：
  - 中文文案由 `Provider` 改为 `提供商`。
  - 跳转按钮文案改为 `去配置提供商 / Go to Providers`。
- 同步重建 `nextclaw` UI 静态产物，确保 `nextclaw serve/start` 能看到最新 UI 改动。

涉及文件：

- `packages/nextclaw-ui/src/components/chat/ChatConversationPanel.tsx`
- `packages/nextclaw-ui/src/lib/i18n.ts`
- `packages/nextclaw/ui-dist/*`（构建同步）

## 测试/验证/验收方式

### 执行命令

- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui tsc`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui build`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw build`

### 结果

- `tsc`：通过。
- `build`：通过。
- `nextclaw build`：通过并完成 `ui-dist` 同步。

## 发布/部署方式

1. 提交本次 UI 与 `ui-dist` 同步改动。
2. 走常规版本化/发布流程。

## 用户/产品视角的验收步骤

1. 使用隔离 `NEXTCLAW_HOME` 启动服务，进入 `/chat`。
2. 在无可用模型时，确认可见“去配置提供商”入口（欢迎卡片或顶部警示条）。
3. 点击入口跳转至 `/providers`。
4. 验证中文界面下文案使用“提供商”，英文界面下文案为 “Providers”。
