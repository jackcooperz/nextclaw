# v0.0.1-marketplace-bilingual-multitab

## 迭代完成说明（改了什么）

- 市场数据模型升级为可扩展多语言字典结构：
  - 新增 `summaryI18n` / `descriptionI18n`（`Record<locale, text>`）
  - 服务端/Worker 对 `zh-CN`、`en-US` 等语言区域键做语言族归一化，稳定映射到 `zh/en`
  - 数据缺失时自动补齐 `en/zh`，并保留未来新增语言键位
  - 相关文件：
    - `workers/marketplace-api/src/domain/model.ts`
    - `workers/marketplace-api/src/infrastructure/bundled-data-source.ts`
    - `workers/marketplace-api/src/infrastructure/in-memory-section-repository-base.ts`
    - `packages/nextclaw-server/src/ui/router.ts`
- UI / Server Marketplace 类型对齐多语言字段与内容详情字段：
  - `packages/nextclaw-server/src/ui/types.ts`
  - `packages/nextclaw-ui/src/api/types.ts`
- 市场页面交互改为“点击即打开微浏览器详情页”（不再同页右侧预览）：
  - Skill：打开完整 `SKILL.md` 详情页（Metadata + Content）
  - Plugin：打开类 VSCode 风格详情页（头部信息 + 元数据 + README/正文）
  - 详情页去重：当摘要和描述相同不重复渲染；失败/本地记录回退不再重复展示同一句说明
  - 相关文件：
    - `packages/nextclaw-ui/src/components/marketplace/MarketplacePage.tsx`
    - `packages/nextclaw-ui/src/api/marketplace.ts`
- 后端新增内容接口：
  - `GET /api/marketplace/skills/items/:slug/content`
  - `GET /api/marketplace/plugins/items/:slug/content`
  - Skill 内容来源优先级：本地 workspace/builtin `SKILL.md` → git spec 对应 raw GitHub `SKILL.md`
  - Plugin 内容来源优先级：NPM Registry README → 远程元信息回退
  - 相关文件：
    - `packages/nextclaw-server/src/ui/router.ts`
- Doc Browser 升级并泛化：
  - 支持多标签（新建/切换/关闭）与每标签独立历史
  - 仅当当前 URL 是 docs 域名时展示底部“文档中心打开”，非文档页面不展示
  - 标题语义改为通用“内嵌浏览器”
  - 相关文件：
    - `packages/nextclaw-ui/src/components/doc-browser/DocBrowserContext.tsx`
    - `packages/nextclaw-ui/src/components/doc-browser/DocBrowser.tsx`
    - `packages/nextclaw-ui/src/lib/i18n.ts`
- 新增可验证测试：
  - `packages/nextclaw-server/src/ui/router.marketplace-content.test.ts`

## 测试 / 验证 / 验收方式

```bash
PATH=/opt/homebrew/bin:$PATH pnpm build
PATH=/opt/homebrew/bin:$PATH pnpm lint
PATH=/opt/homebrew/bin:$PATH pnpm tsc
```

接口级冒烟测试（skill/plugin 内容详情）：

```bash
PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-server exec vitest run src/ui/router.marketplace-content.test.ts
```

观察点：

- skill content 路由返回 `metadataRaw` 与 `bodyRaw`，且包含 `SKILL.md` 真实内容。
- plugin content 路由返回 `bodyRaw`，并可从 NPM Registry 获取 README。
- marketplace 列表在 `summaryI18n` 仅含 `zh-CN/en-US` 时，响应仍产出 `summaryI18n.zh/en`。

## 发布 / 部署方式

- 本次属于 UI + Server + Worker 组合变更，建议按常规 npm 发布流程联动发布：
  - `@nextclaw/ui`
  - `@nextclaw/server`
  - `@nextclaw/marketplace-api-worker`
  - 以及依赖这些包的聚合包（按发布流程检查联动范围）
- 本次无数据库变更，无 migration。

## 用户 / 产品视角验收步骤

1. 进入 `插件` 或 `技能` 市场页面，点击任意卡片，确认直接在微浏览器新标签打开详情页（而非同页右侧预览）。
2. 对 Skill：确认详情页包含完整 `SKILL.md` 的 Metadata 与 Content 两部分。
3. 对 Plugin：确认详情页展示扩展头部信息、元数据和 README 正文。
4. 在微浏览器中先打开文档，再打开 skill/plugin 详情，确认可多 Tab 并行。
5. 切换到非 docs 页面（如 skill/plugin 详情 data 页），确认底部不显示“文档中心打开”。
6. 切回 docs 域名页面，确认底部“文档中心打开”重新出现。
7. 切换中文界面后，确认市场卡片副标题/说明优先显示中文，不再显示英文副标题。
