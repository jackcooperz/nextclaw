# v0.0.1-provider-models-combobox

## 迭代完成说明（改了什么）

本次围绕“模型选择效率 + 自定义模型扩展”完成了前后端联动改造：

- Provider 元数据支持默认模型列表
  - `packages/nextclaw-core/src/providers/registry.ts`
    - 为每个 provider 增加 `defaultModels` 与 `modelPrefix`，并统一默认模型为带前缀格式。
    - DashScope 默认模型收敛为最新一代 Qwen3.5（无日期后缀）：`qwen3.5-plus`、`qwen3.5-flash`、`qwen3.5-397b-a17b`、`qwen3.5-122b-a10b`、`qwen3.5-35b-a3b`、`qwen3.5-27b`。
    - OpenAI 默认模型更新为：`openai/gpt-5.3-codex`、`openai/gpt-5-mini`、`openai/gpt-5-nano`。
    - OpenRouter 默认模型收敛为榜单前列组合（按前列优先顺序）：`openrouter/minimax/minimax-m2.5`、`openrouter/google/gemini-3-flash-preview`、`openrouter/deepseek/deepseek-v3.2`、`openrouter/x-ai/grok-4.1-fast`、`openrouter/z-ai/glm-5`、`openrouter/anthropic/claude-opus-4.6`、`openrouter/openai/gpt-5.3-codex`。
    - Anthropic 默认模型更新为：`anthropic/claude-opus-4-6`、`anthropic/claude-sonnet-4-6`。
    - Gemini 默认模型收敛为 3.x 代：`gemini/gemini-3.1-pro-preview`、`gemini/gemini-3-flash-preview`。
    - DeepSeek 默认模型更新为：`deepseek/deepseek-v3.2`、`deepseek/deepseek-r1`。
    - Zhipu 默认模型收敛为：`zai/glm-5`。
    - Moonshot 默认模型收敛为：`moonshot/kimi-k2.5`。
    - MiniMax 默认模型收敛为：`minimax/MiniMax-M2.5`。
  - `packages/nextclaw-server/src/ui/config.ts`
    - `GET /api/config/meta` 透出 `providers[*].defaultModels`。
    - Provider 列表按产品优先级排序输出：`openai > anthropic > gemini(google) > openrouter > dashscope > deepseek > minimax > moonshot > zhipu`，其余按名称排序。

- Provider 配置支持保存自定义模型列表
  - `packages/nextclaw-core/src/config/schema.ts`
    - 新增 `providers.*.models: string[]` 配置字段（默认空数组）。
  - `packages/nextclaw-server/src/ui/config.ts`
    - `PUT /api/config/providers/:provider` 支持写入/清空 `models`。
    - `GET /api/config` 的 provider 视图增加 `models`。

- 模型配置页支持“可搜索选择 + 可手动输入”二合一
  - 新增组件 `packages/nextclaw-ui/src/components/common/SearchableModelInput.tsx`。
  - `packages/nextclaw-ui/src/components/config/ModelConfig.tsx`
    - 默认模型输入改为双段组合控件：`Provider Select / Model Combobox`。
    - Provider 与模型拆分选择：左侧选择 provider，右侧选择或手输该 provider 下的模型。
    - 保存时自动拼接为标准格式 `provider-prefix/model-id`。
    - 切换 provider 时，右侧模型候选列表会按所选 provider 自适应刷新。
    - 模型页输入框尺寸与 Provider 配置页对齐，统一交互样式。
    - `provider / model` 行改为三列栅格并统一高度，修复左右视觉未对齐问题。
    - 移除“最终保存: provider/model”动态提示，避免输入时产生多余信息干扰。
    - 模型下拉改为“仅排序不按输入过滤”，输入后仍可直接展开并在完整列表中切换模型。

- Provider 页面支持“默认模型 + 自定义模型”管理
  - `packages/nextclaw-ui/src/components/config/ProviderForm.tsx`
    - 新增“可用模型列表”区域。
    - 改为纯输入框添加模型（不使用搜索下拉），支持回车添加与移除自定义模型。
    - 在 Provider 自身表单中使用“无前缀模型 ID”输入；保存时持久化无前缀值。
    - 可用模型列表展示去除“当前 provider 前缀”；若输入 `provider/...` 会自动去掉当前 provider 前缀，但保留后续路径（如 `openai/gpt-5`）。
    - 列表标题与说明文案改为前端 i18n，不再依赖后端英文 schema label（修复 `Custom Models` 未国际化）。
    - 每个模型行 hover 时显示删除图标，支持删除任意模型；移动端删除图标默认可见。
    - 模型列表 UI 调整为胶囊式自动换行布局，避免每个模型独占整行宽度。
    - 兼容旧版“仅自定义增量”数据：旧配置会自动与预置模型合并展示；保存后按当前完整列表持久化。

- 国际化与类型补齐
  - `packages/nextclaw-ui/src/lib/i18n.ts`
  - `packages/nextclaw-ui/src/api/types.ts`
  - `packages/nextclaw-server/src/ui/types.ts`

- 新增后端测试
  - `packages/nextclaw-server/src/ui/router.provider-test.test.ts`
    - 覆盖 provider 模型列表持久化与 meta 默认模型返回。

## 测试 / 验证 / 验收方式

执行命令（当前 shell 需带 PATH 前缀）：

- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-server test -- --run src/ui/router.provider-test.test.ts`
- `PATH=/opt/homebrew/bin:$PATH pnpm build`
- `PATH=/opt/homebrew/bin:$PATH pnpm lint`
- `PATH=/opt/homebrew/bin:$PATH pnpm tsc`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui lint`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui tsc`
- `PATH=/opt/homebrew/bin:$PATH pnpm -C packages/nextclaw-ui build`

结果：

- 所有命令通过；`lint` 仅有仓库既有 `max-lines` 类 warning，无新增 error。

冒烟（可运行路径）：

- 通过 `router.provider-test.test.ts` 实际请求以下接口并断言行为：
  - `PUT /api/config/providers/deepseek`（写入 models）
  - `GET /api/config`（读取持久化 models）
  - `GET /api/config/meta`（读取 defaultModels）

## 发布 / 部署方式

本次是前后端联动（core + server + ui），按常规发布流程执行：

1. 合并代码。
2. 如需发版，执行版本与发布流程（changeset/version/publish）。
3. 若只验证本地 UI，可直接 `pnpm build` 后由 `packages/nextclaw/scripts/copy-ui-dist.mjs` 同步产物。

## 用户/产品视角的验收步骤

1. 打开 `Providers` 页面，选择任意 provider（如 DeepSeek）。
2. 在“可用模型列表”中看到系统预置模型。
3. 在输入框里直接输入模型 ID（无需 provider 前缀），点击“添加模型”或按回车。
4. 将鼠标 hover 到任意模型行，出现删除图标；点击后该模型被移除（移动端图标默认可见）。
5. 点击“保存”，刷新页面后确认新增/删除后的模型列表保持一致。
6. 打开 `Model` 页面，在默认模型区域：
   - 左侧选择 provider，右侧在该 provider 的模型列表中搜索并选择模型；
   - 右侧也支持手动输入自定义模型 ID；
   - 界面以 `provider / model` 展示，保存后写入标准 `provider/model`。
7. 验收标准：
   - 用户可高效选择模型；
   - 缺省模型库可直接用；
   - 新模型可手动扩展并可持久化。
