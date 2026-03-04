# v0.0.1 Unified NPM Minor Release

## 迭代完成说明

- 按统一 `minor` 策略完成本轮累计变更发布。
- 执行发布流程：`release:version` -> `release:publish`（含 readme 同步检查、build/lint/tsc）。
- 实际发布到 npm 的包：
  - `nextclaw@0.9.0`
  - `@nextclaw/ui@0.6.0`
  - `@nextclaw/core@0.7.0`
  - `@nextclaw/server@0.6.0`
  - `@nextclaw/openclaw-compat@0.2.0`
  - `@nextclaw/channel-runtime@0.1.29`
  - `@nextclaw/nextclaw-engine-codex-sdk@0.2.0`
  - `@nextclaw/nextclaw-engine-claude-agent-sdk@0.2.0`
- 对首次发布的 engine 包补做 npm 访问级别设置：
  - `npm access set status=public @nextclaw/nextclaw-engine-codex-sdk`
  - `npm access set status=public @nextclaw/nextclaw-engine-claude-agent-sdk`

## 测试/验证/验收方式

### 执行命令

- `PATH=/opt/homebrew/bin:$PATH pnpm release:version`
- `PATH=/opt/homebrew/bin:$PATH pnpm release:publish`
- 发布后版本核验（/tmp 环境）：
  - `npm view nextclaw version`
  - `npm view @nextclaw/ui version`
  - `npm view @nextclaw/core version`
  - `npm view @nextclaw/server version`
  - `npm view @nextclaw/openclaw-compat version`
  - `npm view @nextclaw/channel-runtime version`
  - `npm view @nextclaw/nextclaw-engine-codex-sdk version`
  - `npm view @nextclaw/nextclaw-engine-claude-agent-sdk version`
- 冒烟（非仓库目录）：
  - 在 `/tmp` 下执行 `npm init -y && npm install nextclaw@0.9.0`
  - 执行 `./node_modules/.bin/nextclaw --version`
  - 执行 `./node_modules/.bin/nextclaw --help`

### 结果

- `release:publish` 全流程通过，8 个包发布成功并创建 tag。
- `/tmp` 冒烟通过：
  - 版本输出 `0.9.0`
  - `--help` 可正常输出命令帮助。

## 发布/部署方式

1. 已执行 npm 发布闭环（changeset version + publish + tag）。
2. 本次不涉及后端服务部署和数据库 migration：`N/A`。
3. 若需同步仓库发布记录，后续补一次版本提交并推送 tags。

## 用户/产品视角的验收步骤

1. 在任意干净目录执行：`npm i nextclaw@0.9.0`。
2. 执行：`nextclaw --version`，应输出 `0.9.0`。
3. 执行：`nextclaw --help`，应正常展示命令列表。
4. 如使用 UI 集成能力，安装后启动并确认 UI 资源可正常加载。

## 文档影响检查

- 功能文档：本次主要为版本发布闭环，无新增用户功能说明，现有功能文档无需额外改写。
- 发布记录：已新增本迭代文档。
