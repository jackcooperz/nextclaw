# v0.0.1 Chat Provider Config Entry

## 迭代完成说明

- 在会话界面新增“未配置 Provider”引导，支持一键跳转到提供商配置页。
- 主要改动：
  - `ChatConversationPanel`：当无可用模型且处于会话欢迎态时，展示 Provider 配置引导卡片。
  - `ChatInputBar`：当无可用模型时，输入框禁用、发送按钮禁用，并显示“去配置 Provider”链接按钮。
  - `ChatPage`：新增 `goToProviders` 跳转逻辑，统一导航到 `/providers`。
  - `i18n`：新增引导文案键，确保中英文按当前界面语言展示。

涉及文件：

- `packages/nextclaw-ui/src/components/chat/ChatPage.tsx`
- `packages/nextclaw-ui/src/components/chat/ChatConversationPanel.tsx`
- `packages/nextclaw-ui/src/components/chat/ChatInputBar.tsx`
- `packages/nextclaw-ui/src/lib/i18n.ts`

## 测试/验证/验收方式

### 执行命令

- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui tsc`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui build`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui lint`
- UI 冒烟（非仓库写入）：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui preview --host 127.0.0.1 --port 4180`
  - `curl -fsS http://127.0.0.1:4180/chat`

### 结果

- `tsc`：通过。
- `build`：通过。
- `lint`：未通过，仍为仓库既有问题（`MaskedInput`、`ProviderForm` 未使用变量等），本次改动未新增 lint error。
- 冒烟：`/chat` 页面可正常返回，包含 `id="root"`，前端可加载。

## 发布/部署方式

1. 按前端发布流程执行版本化与发布（如使用统一发布则纳入对应 changeset）。
2. 发布后刷新前端缓存，确认会话界面在无 Provider 场景可见引导并可跳转到 `/providers`。

## 用户/产品视角的验收步骤

1. 使用“无可用 Provider/模型”的配置进入聊天界面。
2. 在欢迎态看到“开始前先配置 Provider”提示，并可点击“去配置 Provider”。
3. 点击后跳转到提供商配置页面。
4. 输入区域应禁用发送，避免无 Provider 时误发送。
5. 配置并保存 Provider 后返回聊天页，恢复可发送状态。
