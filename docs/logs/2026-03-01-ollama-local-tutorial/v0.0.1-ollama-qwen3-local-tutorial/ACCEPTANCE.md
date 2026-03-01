# Acceptance

## 用户/产品视角验收步骤

1. 打开英文教程索引 `/en/guide/tutorials`，确认存在 `Local Ollama + Qwen3 Tutorial (macOS)`。
2. 打开中文教程索引 `/zh/guide/tutorials`，确认存在 `本地 Ollama + Qwen3 教程（macOS）`。
3. 分别进入中英文教程页面，确认标题含 `macOS`，且步骤覆盖：
   - 启动 Ollama
   - 拉取 Qwen3
   - 配置 NextClaw `vllm` provider
   - 启动 NextClaw
   - CLI 冒烟测试
4. 打开中英文配置页对应章节，点击交叉链接，能跳转到新教程页。
5. 随机复制一条命令（如 `nextclaw config set ...`），检查命令格式可直接执行。
