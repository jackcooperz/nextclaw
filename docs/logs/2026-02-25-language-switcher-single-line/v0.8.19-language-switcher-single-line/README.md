# 2026-02-25 v0.8.19-language-switcher-single-line

## 迭代完成说明（改了什么）

- 将侧边栏语言切换从“分组按钮”改为“单行下拉入口”，视觉风格与侧边栏其它条目保持一致。
- 入口样式对齐：左侧图标 + 文案，右侧展示当前语言值。
- 保留既有行为：切换语言后整页 reload，确保当前与未来后端语言配置可统一生效。
- 变更文件：
  - `packages/nextclaw-ui/src/components/layout/Sidebar.tsx`

## 测试 / 验证 / 验收方式

- 执行：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui lint`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui tsc`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui build`
- 验收观察点：
  1. 语言入口与侧边栏其它项风格一致。
  2. 入口在单行内展示（不换行）。
  3. 切换语言后页面刷新并生效。

## 发布 / 部署方式

- UI-only 发布：
  1. `pnpm release:frontend`
  2. `changeset version`
  3. `changeset publish`

## 用户 / 产品视角的验收步骤

1. 打开 UI 侧边栏，确认语言入口位于一行内展示。
2. 观察入口样式与帮助入口/导航项风格一致。
3. 切换任一语言，确认页面自动刷新并切换成功。
