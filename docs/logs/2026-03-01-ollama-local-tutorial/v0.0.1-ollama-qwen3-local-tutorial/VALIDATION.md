# Validation

## 自动验证

```bash
PATH=/opt/homebrew/bin:$PATH pnpm --filter @nextclaw/docs build
```

结果：

- Docs build 通过（VitePress build complete）。

## 不适用项说明

- `lint`：本次仅文档内容与文案调整，未改动运行时代码，且本次验收以文档站构建可用性为主。
- `tsc`：本次未改动 TypeScript 业务代码或类型定义。

## 冒烟测试

验证点：

1. 教程索引页中英文均能看到“(macOS)”教程入口。
2. 教程页面可正常渲染，命令块、链接、章节结构完整。
3. 配置页中的交叉链接可跳转到对应教程页。
