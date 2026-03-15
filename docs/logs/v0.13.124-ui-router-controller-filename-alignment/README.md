# v0.13.124-ui-router-controller-filename-alignment

## 迭代完成说明（改了什么）
- 将 UI 路由控制器文件命名统一为 `*.controller.ts`，提升模块角色可读性。
- 重命名文件：
  - `app-routes.ts` -> `app.controller.ts`
  - `config-routes.ts` -> `config.controller.ts`
  - `chat-routes.ts` -> `chat.controller.ts`
  - `session-routes.ts` -> `session.controller.ts`
  - `cron-routes.ts` -> `cron.controller.ts`
  - `marketplace/plugin-routes.ts` -> `marketplace/plugin.controller.ts`
  - `marketplace/skill-routes.ts` -> `marketplace/skill.controller.ts`
- 同步更新 `router.ts` 与 marketplace 导出入口的 import 路径，保持统一绑定与行为不变。

## 测试/验证/验收方式
- 类型检查：
  - `pnpm -C packages/nextclaw-server tsc`
- 路由相关测试：
  - `pnpm -C packages/nextclaw-server test -- --run src/ui/router.chat.test.ts src/ui/router.marketplace-content.test.ts src/ui/router.marketplace-manage.test.ts src/ui/router.provider-test.test.ts src/ui/router.session-type.test.ts`
- Lint：
  - `pnpm -C packages/nextclaw-server lint`
  - 结果：无 error，存在既有 warning（与本次重命名无关或非阻断）。

## 发布/部署方式
- 本次仅文件命名与导入路径调整，不涉及发布流程变更。
- 按现有发布流程随常规版本一并发布即可。

## 用户/产品视角的验收步骤
1. 启动 UI Server 并进入 Web UI，确认页面可正常加载。
2. 依次验证配置、聊天、会话、cron、marketplace 页面核心操作可用。
3. 重点确认 marketplace 插件/技能管理与聊天流式接口无回归。
