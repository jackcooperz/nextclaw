# 2026-02-25 v0.8.17-ui-full-i18n

## 迭代完成说明（改了什么）

- 完成 UI 国际化基础设施升级：
  - `packages/nextclaw-ui/src/lib/i18n.ts` 新增语言状态、浏览器语言识别、localStorage 持久化、日期/数字格式化。
  - 新增 `packages/nextclaw-ui/src/components/providers/I18nProvider.tsx`，并在 `packages/nextclaw-ui/src/main.tsx` 接入全局 Provider。
- 在侧边栏新增语言下拉切换器（可扩展多语言），并将导航文案改为动态国际化。
- 语言切换策略调整为“切换后整页 reload”，确保当前页（含 Marketplace）与未来可能接入的后端语言配置一致生效。
- 将主要可见页面/弹窗文案统一接入 i18n：
  - Model / Providers / Channels / Runtime / Sessions / Marketplace
  - ConfirmDialog 默认按钮文案
  - 表单占位文案、状态文案、错误提示文案
- 修复“模块顶层调用 `t()` 导致切换语言不刷新”的问题：
  - `Sidebar`、`StatusBadge`、`ChannelForm` 改为渲染期取词条。
- 日期与数字显示跟随当前语言：
  - Sessions / Cron 时间显示
  - Tabs 计数显示

## 测试 / 验证 / 验收方式

- UI 包验证（带 PATH 修正）：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui lint`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui tsc`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui build`
- 全仓验证（按项目规则执行 build/lint/tsc）：
  - `PATH=/opt/homebrew/bin:$PATH pnpm build`
  - `PATH=/opt/homebrew/bin:$PATH pnpm lint`
  - `PATH=/opt/homebrew/bin:$PATH pnpm tsc`
- 冒烟测试（UI 可运行与国际化关键产物）：
  1. `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui build`
  2. `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui preview --host 127.0.0.1 --port 4174`
  3. `curl http://127.0.0.1:4174` 返回 `200`
  4. 校验 `dist/assets/index-*.js` 包含 `nextclaw.ui.language`、`EN`、`中文`

## 发布 / 部署方式

- UI-only 发布：
  1. 执行 `pnpm release:frontend`
  2. 完成 `changeset version`
  3. 完成 `changeset publish` 与 tag
- 若只本地验证，不发布：
  - 保持当前变更，等待合并后由发布流程统一处理。

## 用户 / 产品视角验收步骤

1. 启动前端并进入 UI 首页。
2. 在侧边栏切换 `EN` / `中文`，确认页面会自动刷新并切换到对应语言。
3. 手动再次刷新页面，确认语言选择被保留（localStorage 持久化）。
4. 进入 Sessions / Cron 页面，确认时间显示随语言格式变化。
5. 进入 Marketplace 页面，确认筛选、分页、安装/启用/卸载相关文案可切换语言。
