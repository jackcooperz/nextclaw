# v0.12.86-chat-runtime-first-pms-design

## 迭代完成说明（改了什么）

1. 新增 Chat 模块重构设计文档：`docs/designs/chat-runtime-first-pms-architecture.md`。
2. 设计明确采用 Runtime-first + Presenter-Manager-Store（PMS）综合架构。
3. 定义了运行状态机、发送策略（默认 interrupt-and-send）、分层职责和分阶段迁移计划。
4. 明确了“删中间同步层、收敛状态真相、页面瘦身”的落地目标与验收标准。

## 测试/验证/验收方式

1. 文档结构校验：确认设计文档包含背景、目标、分层、状态机、迁移计划、验收标准。
2. 规则校验：迭代目录命名遵循 `v<semver>-<slug>`，版本号严格递增到 `v0.12.86`。
3. 影响面判定：本次仅文档改动，`build/lint/tsc` 不适用（未触达代码路径）。

## 发布/部署方式

1. 本次为架构设计文档迭代，无代码发布与部署动作。
2. 后续进入实现迭代时，按影响面执行 `lint/tsc/build` 与 UI 冒烟验证。

## 用户/产品视角的验收步骤

1. 打开 `docs/designs/chat-runtime-first-pms-architecture.md`，确认架构与“清晰、简单、少代码”目标一致。
2. 确认默认发送策略为 `interrupt-and-send`，符合 Codex/Cursor 预期。
3. 确认文档包含可直接执行的迁移阶段（Phase 1~4）与可观测验收标准。
