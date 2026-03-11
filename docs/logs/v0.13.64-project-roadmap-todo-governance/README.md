# v0.13.64-project-roadmap-todo-governance

## 迭代完成说明（改了什么）

- 新增 [项目路线图](../../ROADMAP.md)，作为中长期（3-12 个月）方向管理入口。
- 升级 [TODO 执行池](../../TODO.md)，明确 `ROADMAP / TODO / GitHub Issue` 三层边界与流转规则。
- 在 TODO triage 清单中增加“从 Roadmap 拆解到 Next”的机制，形成从方向到执行的闭环。

## 测试/验证/验收方式

- 文档结构检查：确认 `docs/ROADMAP.md` 与 `docs/TODO.md` 可互相跳转。
- 内容规则检查：确认 TODO 条目要求绑定 Issue，Roadmap 条目要求映射 Milestone/Issue。
- `build/lint/tsc` 不适用：本次仅文档改动，未触达构建/类型/运行链路。

## 发布/部署方式

- 文档类变更，无需服务部署、数据库 migration、NPM 发布。
- 通过代码仓库合并后即生效。

## 用户/产品视角的验收步骤

1. 打开 [ROADMAP](../../ROADMAP.md)，确认能看到季度目标、候选阶段和非目标区。
2. 打开 [TODO](../../TODO.md)，确认能看到 Inbox/Now/Next/Later/Done 执行池。
3. 确认 TODO 与 Roadmap 均指向 Issue 协作，未来待办不再分散在聊天记录中。
