# v0.8.1-docbrowser-floating-resize-axis

## 迭代完成说明（改了什么）

本次迭代修正 DocBrowser 浮窗缩放交互：

1. 浮窗缩放增加 axis 感知（x/y/both）。
2. 仅垂直缩放时不再误改宽度。
3. 仅水平缩放时不再误改高度。

## 测试 / 验证 / 验收方式

### 工程验证

- `pnpm release:publish`（内含 `build`、`lint`、`tsc`）

### 冒烟验证

- `NEXTCLAW_HOME=/tmp/... pnpm -C packages/nextclaw dev:build ui --port 18897`
- `curl -fsS http://127.0.0.1:18897/`
- 观察点：服务启动正常，页面返回 HTML。

## 发布 / 部署方式

1. `pnpm release:version`
2. `pnpm release:publish`

说明：本次仅 UI 代码与 CLI 内置 UI 资源更新，不涉及独立 docs 内容变更，docs 部署不适用。

## 用户/产品视角验收步骤

1. 打开 UI 的 DocBrowser 浮窗。
2. 触发仅水平/仅垂直缩放手柄。
3. 观察对应非目标轴尺寸保持稳定。
4. 验收通过标准：缩放行为符合预期、交互更顺滑。

## 本次执行结果（2026-02-23）

- 已发布 NPM：`nextclaw@0.8.1`、`@nextclaw/ui@0.5.1`
- 已打 tag：`nextclaw@0.8.1`、`@nextclaw/ui@0.5.1`
