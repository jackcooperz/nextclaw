# v0.0.1-minimax-api-base-region

## 迭代完成说明（改了什么）

- 保留单一 `minimax` provider（避免新增 provider 造成重复维护），调整默认 API Base 为中国区地址：
  - `https://api.minimaxi.com/v1`
- 在 Provider 配置表单中，为 `minimax` 增加明显的中英文地区提示（随 UI 语言切换）：
  - 中国区：`https://api.minimaxi.com/v1`
  - 海外：`https://api.minimax.io/v1`
- 变更文件：
  - `packages/nextclaw-core/src/providers/registry.ts`
  - `packages/nextclaw-ui/src/components/config/ProviderForm.tsx`
  - `packages/nextclaw-ui/src/lib/i18n.ts`

## 测试 / 验证 / 验收方式

```bash
PATH=/opt/homebrew/bin:$PATH pnpm build
PATH=/opt/homebrew/bin:$PATH pnpm lint
PATH=/opt/homebrew/bin:$PATH pnpm tsc
```

最小冒烟检查：

```bash
rg -n "defaultApiBase: \"https://api.minimaxi.com/v1\"|providerApiBaseHelpMinimax|api.minimax.io/v1" packages/nextclaw-core/src/providers/registry.ts packages/nextclaw-ui/src/lib/i18n.ts packages/nextclaw-ui/src/components/config/ProviderForm.tsx -S
```

观察点：

- `minimax` 默认地址为中国区地址。
- UI 在 minimax 下展示中英文可切换的“国内/海外地址”提示。

## 发布 / 部署方式

- 本次为 Core + UI 配置与提示调整，按常规 npm 发布流程执行：
  - `pnpm changeset`
  - `pnpm release:version`
  - `pnpm release:publish`
- 无数据库变更，无 migration。

## 用户 / 产品视角验收步骤

1. 打开 Providers 页面，选择 `MiniMax`。
2. 确认 API Base 默认值为 `https://api.minimaxi.com/v1`。
3. 在中文界面确认显示中文提示（包含国内/海外地址）。
4. 切换英文界面确认同位置显示英文提示。
5. 将 API Base 切换为 `https://api.minimax.io/v1` 后保存，验证海外地址可正常保存。
