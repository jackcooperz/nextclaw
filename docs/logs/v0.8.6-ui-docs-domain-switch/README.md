# v0.8.6-ui-docs-domain-switch

## 迭代完成说明（改了什么）

本次迭代将 UI 内置文档浏览器的文档站域名切换到已上线的新域名 `docs.nextclaw.io`：

- 变更文件：`packages/nextclaw-ui/src/components/doc-browser/DocBrowserContext.tsx`
- 变更内容：
  - 删除旧域名常量 `nextclaw-docs.pages.dev`
  - 文档域名白名单仅保留 `docs.nextclaw.io`（含 `www`）
  - `DOCS_DEFAULT_BASE_URL` 改为 `https://docs.nextclaw.io`
- 用户可见结果：UI 文档面板默认打开与跳转均指向新文档站域名。

## 测试 / 验证 / 验收方式

### 工程验证（本次执行）

- `pnpm build`
- `pnpm lint`
- `pnpm tsc`
- `pnpm lint:ui && pnpm tsc:ui`

结果：均通过（存在历史 lint warning，无新增 error）。

### 冒烟验证（本次执行）

- `pnpm -C packages/nextclaw-ui build`
- `rg -o "docs\.nextclaw\.io|nextclaw-docs\.pages\.dev" packages/nextclaw-ui/dist/assets/*.js | sort | uniq -c`

观察点：
- 产物中仅出现 `docs.nextclaw.io`
- 旧域名 `nextclaw-docs.pages.dev` 不再出现

## 发布 / 部署方式

本次仅为 UI 域名指向修正，不涉及后端/数据库变更：

- 远程 migration：不适用（无后端/DB schema 变更）
- 部署方式：按现有 UI 发布流程发版即可（若本轮需要发布）
- 线上验证：发布后打开 UI 文档面板，确认文档地址域名为 `docs.nextclaw.io`

## 用户/产品视角的验收步骤

1. 启动前端（`pnpm dev:frontend`）并进入含文档入口的页面。
2. 打开文档浏览器，确认默认页面 URL 域名为 `docs.nextclaw.io`。
3. 在文档面板内点击任意文档链接，确认后续跳转仍保持 `docs.nextclaw.io`。
4. 验收通过标准：UI 内文档访问不再使用 `nextclaw-docs.pages.dev`。

## 本次执行结果（2026-02-23）

- 已发布 NPM：`nextclaw@0.8.2`、`@nextclaw/ui@0.5.2`
- 已打 tag：`nextclaw@0.8.2`、`@nextclaw/ui@0.5.2`
