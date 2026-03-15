# v0.13.123-ui-router-centralized-binding

## 迭代完成说明（改了什么）
- 将 UI Router 重构为“集中绑定 + 分模块控制器”结构：`packages/nextclaw-server/src/ui/router.ts` 统一声明所有 API 路径与方法绑定。
- 新增并改造控制器分层：
  - `AppRoutesController`
  - `ConfigRoutesController`
  - `ChatRoutesController`
  - `SessionRoutesController`
  - `CronRoutesController`
  - `PluginMarketplaceController`
  - `SkillMarketplaceController`
- 移除 `createRouteDefs` 机制与对应文件，避免额外抽象层，改为模块直接导出 controller 方法。
- 保留既有 API 路径、入参与返回结构，确保对外行为不变。

## 测试/验证/验收方式
- 类型检查：
  - `pnpm -C packages/nextclaw-server tsc`
- 路由相关测试：
  - `pnpm -C packages/nextclaw-server test -- --run src/ui/router.chat.test.ts src/ui/router.marketplace-content.test.ts src/ui/router.marketplace-manage.test.ts src/ui/router.provider-test.test.ts src/ui/router.session-type.test.ts`
- Lint（存在历史 warning，无 error）：
  - `pnpm -C packages/nextclaw-server lint`

## 发布/部署方式
- 本次为服务端路由结构重构，不涉及独立发布流程变更。
- 按项目既有发布流程执行即可（若本次进入发布批次，随常规 release 一并发布）。

## 用户/产品视角的验收步骤
1. 启动 UI Server，打开前端页面，确认基础可用（健康检查、配置读取、聊天页面可进入）。
2. 在配置页执行 provider 新增/更新/测试连接，确认接口返回与 UI 行为正常。
3. 在聊天页执行普通对话、流式对话、停止对话，确认状态与结果正常。
4. 在会话页执行列表、历史、重命名/修改、删除，确认行为一致。
5. 在 marketplace 页面执行插件/技能列表、详情、安装、管理、推荐读取，确认无回归。
