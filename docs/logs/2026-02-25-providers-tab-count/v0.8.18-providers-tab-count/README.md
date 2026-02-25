# 2026-02-25 v0.8.18-providers-tab-count

## 迭代完成说明（改了什么）

- 修复 Providers 页面 tab 计数一致性：
  - `All Providers` tab 现在显示总数，行为与 Channels 页面一致。
- 变更文件：
  - `packages/nextclaw-ui/src/components/config/ProvidersList.tsx`

## 测试 / 验证 / 验收方式

- 执行：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui lint`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui tsc`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui build`
- 验收观察点：Providers 页签 `All Providers` 右侧显示数量，且与实际 provider 列表总数一致。

## 发布 / 部署方式

- UI-only 发布可执行：
  1. `pnpm release:frontend`
  2. `changeset version`
  3. `changeset publish`

## 用户 / 产品视角的验收步骤

1. 打开 Providers 页面。
2. 观察 `Configured` 与 `All Providers` 两个 tab 均展示数字。
3. 对比 `All Providers` 数字与卡片总数，确认一致。
