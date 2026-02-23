# 2026-02-23 v0.8.14-discord-slash-timeout-fix

## 迭代完成说明（改了什么）

- Discord Slash 命令统一先 `deferReply`，避免交互超时导致 “The application did not respond”。
- 对非 ephemeral 返回补充确认回复，确保 defer 的占位响应被正确结束。
- 同步版本：`@nextclaw/channel-runtime@0.1.18`、`@nextclaw/channel-plugin-discord@0.1.6`、`@nextclaw/openclaw-compat@0.1.26`、`@nextclaw/server@0.5.9`、`nextclaw@0.8.14`。

## 测试 / 验证 / 验收方式

```bash
# build / lint / tsc
PATH=/opt/homebrew/bin:$PATH pnpm build
PATH=/opt/homebrew/bin:$PATH pnpm lint
PATH=/opt/homebrew/bin:$PATH pnpm tsc

# Discord 实际验证（本机 token，避免写入仓库目录）
TMP_HOME=$(mktemp -d /tmp/nextclaw-discord-slash-live.XXXXXX)
python3 - <<'PY'
import json
import os
import shutil

cfg_path = os.path.expanduser('~/.nextclaw/config.json')
with open(cfg_path, 'r') as f:
    cfg = json.load(f)

out = {
    "agents": cfg.get("agents"),
    "providers": cfg.get("providers"),
    "channels": {
        "discord": {
            **cfg.get("channels", {}).get("discord", {}),
            "enabled": True
        }
    }
}

os.makedirs(os.environ["TMP_HOME"], exist_ok=True)
with open(os.path.join(os.environ["TMP_HOME"], 'config.json'), 'w') as f:
    json.dump(out, f, ensure_ascii=False, indent=2)
PY
PATH=/opt/homebrew/bin:$PATH NEXTCLAW_HOME="$TMP_HOME" node packages/nextclaw/dist/cli/index.js gateway
# 等待日志出现 "Discord bot connected" 与 "Discord slash commands registered ..."

# 说明：尝试用 bot token 调用 /interactions 会被 Discord 拒绝（403, code=20001），
# 因此真正的 Slash 触发必须由真实用户端操作完成。
python3 - <<'PY'
import json
import os
import urllib.request

cfg = json.load(open(os.path.join(os.environ["TMP_HOME"], 'config.json')))
TOKEN = cfg["channels"]["discord"]["token"]

headers = {
    "Authorization": f"Bot {TOKEN}",
    "User-Agent": "DiscordBot (https://nextclaw.ai, 0.1)",
    "Content-Type": "application/json"
}
req = urllib.request.Request(
    "https://discord.com/api/v10/interactions",
    data=b"{}",
    headers=headers,
    method="POST"
)
try:
    urllib.request.urlopen(req)
    print("INTERACTIONS_OK")
except urllib.error.HTTPError as e:
    print("INTERACTIONS_FORBIDDEN", e.code)
PY
python3 - <<'PY'
import shutil
import os
shutil.rmtree(os.environ["TMP_HOME"], ignore_errors=True)
PY
```

验收点：

- `build/lint/tsc` 执行完成（lint 仅有既有 max-lines 警告）。
- Discord 日志出现 “Discord bot connected” 与 “Discord slash commands registered ...”。
- 由于 Discord 限制，`/interactions` 仅允许 user token 调用，bot token 会返回 403(code=20001)。

## 发布 / 部署方式

- 本次影响 npm 包发布，按 [docs/workflows/npm-release-process.md](../../../workflows/npm-release-process.md) 执行。
- 远程 migration：不适用（本次仅命令/渠道能力改动）。

## 用户/产品视角的验收步骤

1. 启动 gateway，并确保 Discord Bot token 已配置。
2. 在 Discord 服务器中输入 `/help`，确认不再出现 “The application did not respond”，并返回命令列表（ephemeral）。
3. 输入 `/model openai/gpt-4.1`，确认返回 “Model set to …”。
4. 输入 `/reset`，确认返回 “Conversation history cleared …”。
