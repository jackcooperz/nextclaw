# v0.8.2-marketplace-real-data-installed-domain

## 迭代完成说明（改了什么）

本次迭代聚焦修正 Marketplace 的三个核心问题：

1. **数据源职责清晰化（Marketplace vs Installed）**
- `marketplace` 数据继续来自 Cloudflare Worker（`/api/marketplace/items`、`/api/marketplace/recommendations` 代理 Worker）。
- `installed` 数据改为来自 NextClaw 本地真实状态：
  - 插件：基于 `buildPluginStatusReport`（覆盖安装目录、内置/bundled、config 记录）。
  - 技能：基于 `SkillsLoader`（workspace + builtin）。

2. **禁止假数据**
- 去掉 UI 的“安装量/下载量”展示。
- 排序维度去掉 `downloads`，仅保留 `relevance` / `updated`。
- 即使线上 Worker 仍返回 `metrics`，Server 代理层也会主动剥离该字段，避免 UI 接触伪指标。

3. **Installed 视图与真实安装状态对齐（参考 VSCode）**
- Installed 不再依赖“仅过滤当前 catalog 页面结果”。
- 改为以 `GET /api/marketplace/installed` 返回的本地安装记录为基准渲染，确保本地已安装项都可见。
- 已安装项补充状态字段：`enabled` 与 `runtimeStatus`（如 `loaded` / `disabled` / `error`）。
- UI 卡片默认显示启用状态（Enabled/Disabled）。
- `source` 默认不展示，仅作为 hover 信息，不占默认视觉位。

## 测试 / 验证 / 验收方式

### 工程验证（本次执行）

- `pnpm -C workers/marketplace-api build`
- `pnpm -C workers/marketplace-api lint`
- `pnpm -C workers/marketplace-api tsc`
- `pnpm -C packages/nextclaw-core build`
- `pnpm -C packages/nextclaw-core lint`
- `pnpm -C packages/nextclaw-core tsc`
- `pnpm -C packages/nextclaw-server build`
- `pnpm -C packages/nextclaw-server lint`
- `pnpm -C packages/nextclaw-server tsc`
- `pnpm -C packages/nextclaw-ui build`
- `pnpm -C packages/nextclaw-ui lint`
- `pnpm -C packages/nextclaw-ui tsc`

### 冒烟验证（本次执行）

在隔离目录下（避免写仓库）：

- 使用 `NEXTCLAW_HOME=/tmp/... pnpm -C packages/nextclaw dev:build serve --ui-port 18895` 启动 UI/API。
- 验证：
  1. `GET /api/marketplace/items` 返回项不含 `metrics`（`hasMetrics=false`）。
  2. `GET /api/marketplace/installed` 返回记录包含 `enabled` / `runtimeStatus`。
  3. 插件记录可看到 `origin`（如 `bundled`）与本地安装路径信息（如存在）。

观测样例：
- `items[0].has("metrics") -> false`
- `installed.records[0]` 包含 `enabled: true`, `runtimeStatus: "loaded"`, `origin: "bundled"`

## 发布 / 部署方式

- 本次涉及 UI + Server + Core + Worker（契约与状态字段调整）。
- 若发布：
  1. 发布 worker（使线上 API 不再返回 `metrics`）。
  2. 发布 `@nextclaw/server` 与 `@nextclaw/ui`（Installed 视图逻辑生效）。
  3. 按项目发布流程执行 build/lint/tsc 与上线冒烟闭环。

## 用户/产品视角验收步骤

1. 启动 NextClaw UI（使用本次版本）。
2. 打开 `/marketplace`：
- 确认卡片不再出现“downloads / 30d”这类伪指标。
- 排序仅有 `Relevance` / `Recently Updated`。
3. 切换到 `Installed`：
- 本地已安装项应完整可见。
- 即使某项不在线上 catalog，也应看到本地 Installed 卡片。
- 已安装项应有启用状态（Enabled/Disabled）。
- `source` 不应默认展示，仅在 hover/附加信息中可见。
4. 验收通过标准：
- 无假指标数据。
- Installed 与本地实际安装一致。
- 仅统计 NextClaw 管理域的技能与插件。
