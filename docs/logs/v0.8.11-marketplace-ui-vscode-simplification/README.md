# 2026-02-23 v0.8.11-marketplace-ui-vscode-simplification

## 背景 / 问题

- Marketplace 插件页信息密度过高，存在“同屏多维状态 + 过多 badge + 双套卡片样式”导致的阅读负担。
- 用户期望体验接近 VS Code 扩展市场：列表简洁、状态明确、主操作直达。

## 迭代完成说明（改了什么）

- `packages/nextclaw-ui/src/components/marketplace/MarketplacePage.tsx`
  - 重构为更简洁的单列列表卡片风格，聚焦核心信息：名称、摘要、类型、状态、主操作（Install/Enable/Disable）。
  - 去除推荐区与冗余展示元素，降低视觉噪音。
  - 统一“商城项”和“已安装项”的卡片结构，不再维护两套展示范式。
  - 保留必要能力：安装、启用、禁用、卸载、筛选、分页。

## 测试 / 验证 / 验收方式

执行命令：

```bash
pnpm -C packages/nextclaw-ui tsc
pnpm -C packages/nextclaw-ui lint
pnpm build
pnpm lint
pnpm tsc
```

CLI/UI API 冒烟（在临时目录，不写仓库）：

```bash
TMP_HOME=$(mktemp -d /tmp/nextclaw-market-ui-smoke.XXXXXX)
NEXTCLAW_HOME="$TMP_HOME" pnpm -C packages/nextclaw dev:build serve --ui-port 18998

# 观察点：Marketplace API 可用，插件 enable/disable 可实时回切
curl -sf http://127.0.0.1:18998/api/marketplace/installed
curl -sf -X POST http://127.0.0.1:18998/api/marketplace/manage \
  -H 'content-type: application/json' \
  -d '{"type":"plugin","action":"disable","id":"@nextclaw/channel-plugin-discord","spec":"@nextclaw/channel-plugin-discord"}'
curl -sf -X POST http://127.0.0.1:18998/api/marketplace/manage \
  -H 'content-type: application/json' \
  -d '{"type":"plugin","action":"enable","id":"@nextclaw/channel-plugin-discord","spec":"@nextclaw/channel-plugin-discord"}'

rm -rf "$TMP_HOME"
```

## 发布 / 部署方式

- 本次变更为 UI 重构，尚未执行新一轮 npm 发布。
- 若需发布，按流程执行：
  1. `pnpm changeset`
  2. `pnpm release:version`
  3. `pnpm release:publish`
- 本次不涉及数据库变更，无 migration 需求。

## 用户 / 产品视角的验收步骤

1. 进入 UI 的 Marketplace 页面。
2. 确认列表呈现为简洁单列样式，信息主要聚焦名称、状态、操作。
3. 搜索任意插件（如 discord），确认结果可快速定位。
4. 对 Discord 执行 `Disable`，确认状态切为 Disabled。
5. 再执行 `Enable`，确认状态恢复为 Enabled。
6. 对可卸载插件/技能执行 `Uninstall`，确认交互与状态变化一致。

## 影响范围 / 风险

- 影响范围：`@nextclaw/ui`。
- Breaking change：否。
- 风险：纯前端展示层重构，功能接口未改；主要风险在 UI 交互一致性，已通过构建与冒烟验证。
