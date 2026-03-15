# v0.13.118-config-meta-state-sink-minimal-ancestor-rule

## 迭代完成说明（改了什么）

- 在 Rulebook 中新增规则 **state-sink-minimal-ancestor**：前端状态应尽量下沉到最小公共组件层级；纯展示组件不得持有或混入业务状态，仅接收展示所需 props。

## 测试/验证/验收方式

- `build/lint/tsc` 不适用（未触达代码路径，仅 AGENTS.md 规则新增）。
- 文档结构检查：`docs/logs/v0.13.118-config-meta-state-sink-minimal-ancestor-rule/README.md` 存在且包含四部分。

## 发布/部署方式

- 不适用。

## 用户/产品视角的验收步骤

1. 打开 `AGENTS.md`，在 Rulebook 中搜索 `state-sink-minimal-ancestor`，确认规则已存在且结构完整。
2. 后续前端组件设计/重构时，按该规则执行状态下沉与纯展示组件边界划分。
