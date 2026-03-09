# v0.12.98-mvp-view-logic-decoupling-skill

## 迭代完成说明（改了什么）

- 新增内置 skill：`mvp-view-logic-decoupling`。
  - 路径：`packages/nextclaw-core/src/agent/skills/mvp-view-logic-decoupling/SKILL.md`
  - 内容聚焦“视图与逻辑解耦-MVP 架构-可维护性”，明确 presenter-manager-store 约束：
    - 状态统一在 `stores/`（Zustand 单例）
    - 每个 store 对应一个 manager class（位于 `managers/`）
    - 全局 presenter 维护所有 manager 与全局能力
    - React Context + `usePresenter` 暴露 presenter
    - UI 组件与业务组件分层，业务编排层与功能模块分层
    - manager/presenter 所有方法统一箭头函数
    - manager/presenter 禁止 constructor
    - 强化“减少业务组件不必要 prop 透传”检查
- 更新内置 skills 索引文档：
  - `packages/nextclaw-core/src/agent/skills/README.md` 新增 `mvp-view-logic-decoupling` 条目。
- 初始化过程使用 `skill-creator` 官方脚本，并生成 `agents/openai.yaml`：
  - `packages/nextclaw-core/src/agent/skills/mvp-view-logic-decoupling/agents/openai.yaml`

## 测试/验证/验收方式

- 结构校验（skill 规范）
  - 命令：
    - `python3 /Users/peiwang/.codex/skills/.system/skill-creator/scripts/quick_validate.py /Users/peiwang/Projects/nextbot/packages/nextclaw-core/src/agent/skills/mvp-view-logic-decoupling`
  - 结果：`Skill is valid!`
- 冒烟验证（运行时可发现新 skill）
  - 命令：
    - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-core exec tsx -e "import { SkillsLoader } from './src/agent/skills.ts'; const loader=new SkillsLoader(process.cwd()); const names=loader.listSkills(false).map(s=>s.name); console.log(names.includes('mvp-view-logic-decoupling') ? 'FOUND' : 'MISSING'); console.log(names.filter(n=>n.includes('mvp')||n.includes('skill')).sort().join(','));"`
  - 结果：
    - `FOUND`
    - `mvp-view-logic-decoupling,nextclaw-skill-resource-hub,skill-creator`
- `build/lint/tsc` 判定：
  - 本次改动为 skill 文档与 skills README 索引更新，未改动 TS/构建链路代码。
  - `build/lint/tsc` 标记为“不适用（未触达构建/类型/运行链路代码）”。

## 发布/部署方式

- 本次无需独立部署。
- 随 `@nextclaw/core` 后续常规发布流程生效（构建阶段 `copy-skills` 会带上新增 skill 目录）。
- 如需立即对外可用，按项目 NPM 发布流程执行一次版本发布闭环。

## 用户/产品视角的验收步骤

1. 在需要前端架构改造的对话中明确提需求关键词，例如“请按 MVP + presenter-manager-store 解耦这个页面，减少 prop 透传”。
2. 检查助手输出是否包含以下核心约束：
   - UI 组件无业务逻辑
   - 业务组件直接使用 presenter/store
   - manager/presenter 使用箭头函数且无 constructor
   - 有业务编排层与领域模块分层
3. 要求助手给出落地骨架（`stores/`、`managers/`、`presenter/`、`usePresenter`），并执行一次重构清单自检。
4. 抽查改造后的业务组件：若仍存在可被 presenter 替代的多层 prop 透传，应判定为未达标并继续清理。
