# 2026-02-28 provider test route hotfix

## 迭代完成说明（改了什么）

- 紧急修复发布链路错配：此前 `nextclaw@0.8.44` 已包含 UI「测试连接」按钮，但 npm 依赖的 `@nextclaw/server@0.5.21` 未包含 `POST /api/config/providers/:provider/test` 路由。
- 本次通过发布补丁版本同步修复：
  - `@nextclaw/server` 升级发布（包含 provider test 路由）
  - `nextclaw` 联动发布，确保安装 `nextclaw` 时可解析到修复后的 server 版本

## 测试 / 验证 / 验收方式

```bash
PATH=/opt/homebrew/bin:$PATH pnpm release:check
PATH=/opt/homebrew/bin:$PATH npm view @nextclaw/server version
PATH=/opt/homebrew/bin:$PATH npm view nextclaw version
```

验收点：

- npm 上 `@nextclaw/server` 与 `nextclaw` 已是本次 hotfix 版本。
- 抽检 npm tarball 中包含 `app.post("/api/config/providers/:provider/test"...)` 路由实现。

## 发布 / 部署方式

- 按 npm 发布流程执行：

```bash
PATH=/opt/homebrew/bin:$PATH pnpm release:version
PATH=/opt/homebrew/bin:$PATH pnpm release:publish
```

- 本次为 npm 包修复发布，不涉及数据库或后端 migration。

## 用户/产品视角验收步骤

1. 升级到最新 `nextclaw` 版本（或重新安装）。
2. 执行 `nextclaw start` 打开 UI。
3. 进入 Providers，点击“测试连接”。
4. 预期：不再出现 `Non-JSON response (404 Not Found)`，应返回结构化成功/失败结果。
