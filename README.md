# 俄罗斯方块 MVP

经典 Tetris 单页游戏，纯前端、零后端、零安装。Svelte 5 + TypeScript + Vite，浏览器即玩。

## ✨ 特性

- 🎮 完整 SRS 旋转 + Hold + 7-bag 随机
- ⚡ 60fps Canvas 渲染（自研状态机，无虚拟 DOM 浪费）
- 📦 体积：JS gzip **14.38 kB** + CSS 0.81 kB + HTML 0.40 kB = **15.59 kB 总 gzipped**
- ♿ 键盘 / DAS（170ms）/ ARR（50ms）操控
- 🧪 106 单测全绿（`core/` ≥ 95%）
- 🚀 静态托管，GitHub Pages 自动部署

## 🚀 快速开始

**前置依赖**：Node 20.10+、pnpm 9+

```bash
nvm use          # 读 .nvmrc
pnpm install     # 装依赖
pnpm dev         # http://localhost:5173
```

## 📜 常用命令

| 命令 | 作用 |
|---|---|
| `pnpm dev` | 开发服务器（HMR） |
| `pnpm build` | 生产构建 → `dist/` |
| `pnpm preview` | 预览构建产物 |
| `pnpm demo:core` | Node 跑游戏逻辑 demo（无浏览器依赖） |
| `pnpm lint` | Biome 检查 |
| `pnpm lint:fix` | Biome 自动修复 |
| `pnpm format` | Biome 格式化 |
| `pnpm type-check` | svelte-check + tsc |
| `pnpm test` | Vitest 监视模式 |
| `pnpm test:run` | Vitest 单次运行 |
| `pnpm test:coverage` | Vitest + 覆盖率报告 |
| `pnpm test:e2e` | Playwright E2E（Chromium） |
| `pnpm test:e2e:install` | 下载 Chromium 二进制 |

## ⌨️ 键盘控制

| 键 | 动作 |
|---|---|
| ← → | 左右移动 |
| ↓ | 软降（soft drop） |
| ↑ / X | 顺时针旋转 |
| Z | 逆时针旋转 |
| Space | 硬降（hard drop） |
| C / Shift | Hold |
| P / Esc | 暂停 |
| Enter | 开始 / 重开 |

## 🏗️ 架构

```
src/
├── core/        # 框架无关纯 TS（90% 代码，零外部依赖）
│   ├── types.ts
│   ├── board.ts
│   ├── tetromino.ts
│   ├── rotation.ts        # SRS kick table（28 组偏移全测）
│   ├── randomizer.ts      # 7-bag
│   ├── scoring.ts
│   ├── gravity.ts
│   ├── collision.ts
│   ├── lock.ts            # Lock delay + reset cap
│   ├── lineClear.ts
│   └── gameMachine.ts     # 自研 reducer 状态机
├── input/
│   └── keyboard.ts        # DAS / ARR / 键映射
├── render/
│   ├── canvasRenderer.ts
│   └── theme.ts
├── ui/                    # Svelte 5 组件（HUD / Board / Pause / GameOver）
├── extensions/            # 4 接口预留（MVP 不实现）
│   ├── IHighScoreStorage.ts
│   ├── IReplayRecorder.ts
│   ├── IThemeProvider.ts
│   └── IAccountProvider.ts
└── app/
    ├── main.ts            # composition root
    └── loop.ts            # rAF tick 循环
```

**依赖方向（严格单向）**：
```
ui/ ──┐
input/ ──┐
render/ ──┼──→  core/  ←──  extensions/（接口）
        app/ ──→  render/ + input/ + ui/
```

## 🧪 测试

- **单测**（Vitest，106 用例）：`core/` ≥ 95% 覆盖率，全仓 ≥ 80%
- **E2E**（Playwright，Chromium-only）：架构 §7.2 的 7 条键盘流

详见 [`docs/TEST_STRATEGY.md`](docs/TEST_STRATEGY.md)。

## 🚢 部署

合并 `main` 分支 → CI 5 段全绿 → 自动部署到 **GitHub Pages**。

PR 预览：Actions 自动在 PR 评论附上预览链接（`actions/deploy-pages@v4` + Pages 环境）。

部署架构：详见 `.github/workflows/deploy.yml` + `public/_headers`（缓存策略 + 安全头）。

## 📐 ADR（架构决策记录）

参见 issue NIE-13 架构评论，包含 3 条 ADR：
- ADR-001：Svelte 5 + TS + Vite
- ADR-002：Canvas 2D + DOM HUD
- ADR-003：自研状态机（不引入 Redux/Zustand）

## 📄 License

MIT