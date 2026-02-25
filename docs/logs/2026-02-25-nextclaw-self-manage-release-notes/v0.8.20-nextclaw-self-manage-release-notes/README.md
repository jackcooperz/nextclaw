# 2026-02-25 v0.8.20-nextclaw-self-manage-release-notes

## 迭代完成说明（改了什么）

- 内置管理技能 `packages/nextclaw-core/src/agent/skills/nextclaw-self-manage/SKILL.md` 增加“Release Notes / Changelog Lookup”入口。
- 将详细规则拆分到 references：
  - `packages/nextclaw-core/src/agent/skills/nextclaw-self-manage/references/release-notes-changelog.md`
- 规则内容明确：
  - 先查 npm 版本与发布时间（`npm view`）
  - 再查包级 `CHANGELOG.md`
  - 若条目过于通用则回退 `docs/logs` 对应版本日志
  - 输出必须包含可追溯路径，禁止无依据描述

## 测试 / 验证 / 验收方式

- 构建验证（确保 skill 资产可正常打包）：
  - `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-core build`
- 冒烟验证（确认技能内容进入构建产物）：
  1. `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-core build`
  2. `rg -n "Release Notes / Changelog Lookup" packages/nextclaw-core/dist/skills/nextclaw-self-manage/SKILL.md`
  3. `rg -n "Deterministic Lookup Order" packages/nextclaw-core/dist/skills/nextclaw-self-manage/references/release-notes-changelog.md`
  4. 观察命中行，确认主技能入口与 references 细则均进入 dist

## 发布 / 部署方式

- 本次为内置 skill 文档规则更新，随 `@nextclaw/core` 发版发布：
  1. `pnpm changeset`
  2. `pnpm release:version`
  3. `pnpm release:publish`

## 用户 / 产品视角的验收步骤

1. 向 AI 询问“某版本改了什么（如 nextclaw 0.8.19）”。
2. 观察回答是否先给版本与时间，再引用 `CHANGELOG.md`。
3. 当 changelog 过于通用时，观察是否自动补充 `docs/logs` 对应版本记录。
4. 观察回答是否附带具体文件路径，便于人工复核。
