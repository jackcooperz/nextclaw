# v0.0.1-lightweight-installers

## 迭代完成说明（改了什么）

- 新增统一安装器构建脚本 `scripts/installer/build-installer.mjs`：
  - 支持 `darwin/win32` + `x64/arm64` 四种目标。
  - 自动下载 Node Runtime（默认 `22.20.0`）。
  - 打包本地 `nextclaw` 产物，安装依赖后删除 sourcemap 以减小包体。
  - 自动写入启动器：
    - macOS：`Start NextClaw.command` + `nextclaw`
    - Windows：`Start NextClaw.cmd` + `nextclaw.cmd`
  - 自动输出安装器与构建清单（manifest JSON）。
  - 安装器文件名统一增加 `-beta-` 标识，明确当前为 Beta 分发。
- 新增 Windows NSIS 模板 `scripts/installer/windows-installer.nsi`：
  - 用户态安装到 `$LOCALAPPDATA\Programs\NextClaw`。
  - 自动创建桌面与开始菜单快捷方式。
  - 生成卸载入口并注册到 Windows 卸载列表。
- 新增 CI 工作流 `.github/workflows/installer-build.yml`：
  - 并行构建四类安装器（mac arm64/x64 + win x64/arm64）。
  - 构建后上传安装器与 manifest 为 artifacts。
- 更新安装文档：
  - `README.md` / `README.zh-CN.md` 增加“桌面安装包”入口。
  - `docs/USAGE.md` Quick Start 改为“安装器优先，npm 次之”。
- 更新根脚本入口：
  - `package.json` 新增 `installer:build*` 系列命令。

关键文件：

- `.github/workflows/installer-build.yml`
- `scripts/installer/build-installer.mjs`
- `scripts/installer/windows-installer.nsi`
- `package.json`
- `README.md`
- `README.zh-CN.md`
- `docs/USAGE.md`

## 测试 / 验证 / 验收方式

基础验证（规则要求）：

- `PATH=/opt/homebrew/bin:$PATH pnpm build`
- `PATH=/opt/homebrew/bin:$PATH pnpm lint`
- `PATH=/opt/homebrew/bin:$PATH pnpm tsc`

安装器脚本冒烟（隔离目录，避免仓库写入）：

- `PATH=/opt/homebrew/bin:$PATH node scripts/installer/build-installer.mjs --platform=darwin --arch=arm64 --output-dir=/tmp/nextclaw-installers-smoke`
- 观察点：
  - 成功生成 `NextClaw-0.8.41-beta-macos-arm64-installer.pkg`
  - 成功生成 `manifest-darwin-arm64.json`
  - manifest 中包含 `bundleSizeBytes` 与安装器大小

体积实测（本轮基线）：

- `nextclaw` npm 包：约 `490 KB`
- 裁剪 sourcemap 后应用 payload 压缩体积：约 `17 MB`
- Node Runtime 压缩包：
  - Windows x64：约 `33.9 MB`
  - macOS arm64：约 `47.5 MB`
- 安装器体积：
  - macOS arm64 实测：`67.3 MB`
  - Windows 预估：约 `55-70 MB`
  - macOS（按架构分发）预估：约 `65-85 MB`

## 发布 / 部署方式

安装器构建（CI）：

1. 触发 `installer-build` workflow（`workflow_dispatch` 或打 `v*` tag）。
2. 等待四个矩阵任务构建完成。
3. 从 workflow artifacts 下载安装器：
   - `nextclaw-installer-darwin-arm64`
   - `nextclaw-installer-darwin-x64`
   - `nextclaw-installer-win32-x64`
   - `nextclaw-installer-win32-arm64`
4. 上传到 GitHub Releases 对应版本页面。

本次仅新增安装器构建链路，不涉及后端或数据库改动：

- 远程 migration：不适用（无后端/数据库 schema 变更）。

## 用户 / 产品视角的验收步骤

1. 打开 Releases 页面下载对应系统安装器（mac `.pkg` / win `.exe`）。
2. 双击安装并完成向导。
3. 从桌面或开始菜单点击 **Start NextClaw**。
4. 浏览器自动打开 `http://127.0.0.1:18791`。
5. 在 UI 中配置一个 Provider + 模型并发送一条消息。
6. 关闭后执行 `nextclaw stop`（或在命令行中结束服务），确认可正常停止。

## 文档影响检查

- 已更新：
  - `README.md`
  - `README.zh-CN.md`
  - `docs/USAGE.md`
- `commands/commands.md`：不适用（本次未新增元指令）。
