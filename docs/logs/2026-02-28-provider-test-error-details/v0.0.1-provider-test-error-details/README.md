# 2026-02-28 provider test error details

## 迭代完成说明（改了什么）

- Provider「测试连接」失败时，UI 现在直接透传并展示更完整的诊断信息。
- `Non-JSON response` 场景增加关键信息拼接：`status`、`method`、`endpoint`、响应体片段（`body`）。
- 对常见状态码补充轻量提示：
  - `404`（尤其是 `/api/config/providers/:provider/test`）提示可能是运行时版本过旧。
  - `401/403`、`429`、`5xx` 给出最小可执行建议。
- Provider 测试结果失败 toast 增加上下文：`provider`、`model`（若有）、`latency`。
- 中英文配置文档新增「测试连接失败排查」章节。

## 测试 / 验证 / 验收方式

```bash
pnpm build
pnpm lint
pnpm tsc
pnpm --filter @nextclaw/ui build
```

验收点：

- 测试连接失败时，toast 不再只显示单句失败，而是包含请求上下文（例如 `POST /api/config/providers/openai/test`、`status`、`body` 片段）。
- 失败结果中可看到 `provider` 与 `latency` 信息，便于快速判断是配置问题还是网络/上游问题。
- 文档 `configuration` 页面可看到新增排查章节（中英文一致）。

## 发布 / 部署方式

- 本次为 UI + docs 变更。
- 若发布 npm 包，按项目发布流程执行（changeset/version/publish）。
- 若仅发布文档站，执行 docs 部署流程即可。

## 用户/产品视角的验收步骤

1. 执行 `nextclaw start`，进入 UI 的 Providers 页面。
2. 随机选择一个 provider，故意填错配置（如无效 key 或错误 apiBase）。
3. 点击「测试连接」。
4. 预期：错误提示包含更具体上下文（至少含状态/接口信息或 provider/latency），可直接据此定位问题。
