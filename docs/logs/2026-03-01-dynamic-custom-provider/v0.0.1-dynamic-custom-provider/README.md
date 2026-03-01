# 2026-03-01 Dynamic Custom Provider

## 背景 / 问题

- 现有 Provider 页面只支持固定内置提供商，无法真正新增“自定义中转站 Provider”。
- 用户需要能够同时保存多个中转站，并可自定义名称、随时切换启用。
- 固定 `custom1/custom2` 槽位不符合“按需新增/删除”的使用方式。

## 决策

- 改为支持动态新增自定义 Provider（非固定槽位）。
- 自定义 Provider 允许编辑展示名称、支持删除。
- 自定义 Provider 默认按 OpenAI 兼容格式接入（Chat Completions / Responses）。
- Providers 列表中自定义 Provider 置顶显示。

## 变更内容

- 用户可见变化：
  - Providers 页面新增“新增自定义提供商”按钮。
  - 自定义 Provider 支持编辑名称、保存配置、删除。
  - 自定义 Provider 详情页显示 OpenAI 兼容格式提示。
  - 自定义 Provider 在 Provider 列表前面展示。
- 关键实现点：
  - `packages/nextclaw-core/src/config/schema.ts`
    - Provider 配置 schema 从固定字段扩展为可接收动态 key（`catchall`）。
    - Provider 路由匹配支持按模型前缀命中动态自定义 Provider。
  - `packages/nextclaw-server/src/ui/config.ts`
    - 新增动态 custom provider 元数据构建逻辑（置顶、isCustom、wireApi 支持）。
    - 新增创建/删除自定义 Provider 的配置更新函数。
  - `packages/nextclaw-server/src/ui/router.ts`
    - 新增 `POST /api/config/providers`（创建 custom provider）。
    - 新增 `DELETE /api/config/providers/:provider`（删除 custom provider）。
  - `packages/nextclaw-ui/src/components/config/ProvidersList.tsx`
    - 新增创建按钮并在创建后自动定位到新 Provider。
  - `packages/nextclaw-ui/src/components/config/ProviderForm.tsx`
    - 自定义 Provider 支持名称编辑、删除操作和 OpenAI 兼容提示。

## 验证（怎么确认符合预期）

```bash
# 定向测试
PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-core test -- run src/config/schema.provider-routing.test.ts
PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-server test -- run src/ui/router.provider-test.test.ts

# 全量校验
PATH=/opt/homebrew/bin:$PATH pnpm build
PATH=/opt/homebrew/bin:$PATH pnpm lint
PATH=/opt/homebrew/bin:$PATH pnpm tsc
```

验收点：

- `router.provider-test.test.ts` 通过，且覆盖创建/重命名/删除 custom provider。
- `schema.provider-routing.test.ts` 通过，确认 `custom-1/<model>` 路由正确。
- `build/lint/tsc` 全部通过（lint 仅保留仓库既有 warning，无新增 error）。

## 用户/产品视角验收步骤

1. 打开 UI 的 Providers 页面。
2. 点击“新增自定义提供商”，应在列表顶部出现新条目。
3. 进入该条目，修改“自定义名称”、填入 `apiBase`/`apiKey` 并保存。
4. 在模型页选择该 Provider 并填写模型 ID（组合后应为 `<provider-key>/<model-id>`）。
5. 回到 Providers 页面删除该自定义 Provider，列表中应立即消失。

## 发布 / 部署

- 本次涉及 `@nextclaw/core`、`@nextclaw/server`、`@nextclaw/ui` 行为变更。
- 发布时按 `docs/workflows/npm-release-process.md` 执行 changeset/version/publish 流程。
- 如仅本地验证，可直接在开发环境热重载生效；正式发布请走统一 NPM 发布流程。

## 影响范围 / 风险

- Breaking change：否。
- 风险点：已有脚本若假设 provider key 固定集合，可能需要适配动态 key。
- 回滚方式：回退本次相关提交（core schema/router/ui provider 管理改动）。
