# v0.13.71-marketplace-skill-assets-r2

## 迭代完成说明（改了什么）

- 将 marketplace skill 文件资产从 D1 内联内容改为 **R2 主存储**，D1 仅保留索引与元数据。
- 在 `marketplace_skill_files` 增加 R2 相关字段：`storage_backend`、`r2_key`、`size_bytes`，并新增索引。
- marketplace API 新增按路径下载文件接口：`GET /api/v1/skills/items/:slug/files/blob?path=...`。
- marketplace API 的 `GET /api/v1/skills/items/:slug/files` 调整为返回文件清单（manifest）+ `downloadPath`，不再返回整包 base64 内容。
- `GET /api/v1/skills/items/:slug/content` 改为按需读取 `SKILL.md` 文件内容（优先 `SKILL.md`，回退 `skill.md`）。
- skill upsert 改为：上传时写入 R2；D1 只写元数据，并清理旧文件索引；读取旧 D1 内联内容时会懒迁移到 R2。
- CLI `nextclaw skills install` 改为“先拉 manifest，再逐文件 blob 下载”，避免单个超大 JSON 响应。
- worker 运行时新增 R2 绑定 `MARKETPLACE_SKILLS_FILES`，并更新相关文档。

## 测试/验证/验收方式

- Worker 代码验证：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C workers/marketplace-api build`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C workers/marketplace-api lint`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C workers/marketplace-api tsc`
- CLI 代码验证：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw build`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw lint`
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw tsc`
- 冒烟测试（非仓库目录 `/tmp`）：
  - 启动临时 mock marketplace（manifest + blob）
  - 调用 `installMarketplaceSkill` 完整安装链路
  - 观察到输出：`smoke-ok destination=... source=marketplace`
  - 验证安装后的 `SKILL.md` 与子文件内容正确

## 发布/部署方式

1. 先应用数据库迁移（skills）：
   - `PATH=/opt/homebrew/bin:$PATH pnpm -C workers/marketplace-api db:migrate:remote`
2. 部署 marketplace worker：
   - `PATH=/opt/homebrew/bin:$PATH pnpm -C workers/marketplace-api run deploy`
3. 发布 CLI（如本次一起发版）：
   - 按项目发布流程执行 version + publish
4. 部署后健康检查：
   - `curl -sS https://marketplace-api.nextclaw.io/health`
   - 预期 `storage` 为 `d1+r2`

## 用户/产品视角的验收步骤

1. 在 marketplace 发布一个包含多文件目录结构的 skill（至少含 `SKILL.md` + 子目录文件）。
2. 执行 `nextclaw skills install <slug>`。
3. 验证安装目录下文件结构与内容完整，且安装成功时间不再受单个大 JSON 响应明显影响。
4. 访问 skill 详情页（或内容接口）验证 `SKILL.md` 正常展示。
5. 回归安装历史旧 skill，确认仍可安装（旧数据可被懒迁移到 R2）。
