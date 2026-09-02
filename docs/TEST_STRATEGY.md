# TEST_STRATEGY · Tetris MVP

> 测试工程师交付 · 与前端工程师 / CI/CD 架构师并行协作
> 修订随架构演进；本文档是测试体系的唯一真相源。

## 1. 测试金字塔（70 / 20 / 10）

| 层 | 工具 | 目标覆盖 | 覆盖范围 |
|---|---|---|---|
| 单测 70% | Vitest + coverage-v8 | `core/` ≥ 95%、全仓 ≥ 80% | `src/core/**`、`src/input/**`、`src/render/**` 的纯函数 |
| 集成 20% | Vitest（多模块串联） | 同上 | `gameMachine` × `randomizer` × `collision` × `lineClear` 串联 |
| E2E 10% | Playwright | 关键路径 7 条全绿 | `src/ui/**` + `src/app/**`，真实键盘流 |

**规则**：能用单测覆盖的不写集成；能用集成覆盖的不写 E2E。E2E 只测「端到端键盘流」与「DOM/Canvas 渲染契约」，单测已经兜住的纯逻辑不在 E2E 重复。

## 2. 目录与命名约定

```
test/
├── core/                        # Vitest 单测（Node 环境）
│   ├── helpers/
│   │   ├── boardFactory.ts      # emptyBoard / fillRow / setCell
│   │   └── seededRng.ts         # Mulberry32，确定性 RNG
│   ├── rotation.test.ts         # SRS kick table 全 28 组偏移
│   ├── lineClear.test.ts        # 单/双/Tetris 行满 + 边缘 case
│   ├── gameMachine.test.ts      # 状态转换全覆盖
│   ├── randomizer.test.ts       # 7-bag 完整性 + 注入 RNG 后确定性
│   └── ...
└── e2e/                         # Playwright E2E
    ├── helpers/
    │   └── keyboard.ts          # 物理键名 + 长按封装
    ├── 01-idle-to-playing.spec.ts
    ├── 02-move-rotate-hard-drop.spec.ts
    ├── 03-line-clear-score.spec.ts
    ├── 04-hold.spec.ts
    ├── 05-top-out-game-over.spec.ts
    ├── 06-pause-resume.spec.ts
    └── 07-level-gravity.spec.ts
```

**文件命名**：`{module}.test.ts`（Vitest ）、`NN-{场景}.spec.ts`（E2E 用数字前缀保证跑测顺序与可读性）。

## 3. 覆盖率门槛（CI 卡门禁）

两档（避免双源 = 唯一来源即 vitest.config.ts 内联 thresholds）：

| 范围 | lines | 备注 |
|---|---|---|
| 全局（`src/**`） | **80%** | 卡住整体质量底线 |
| `src/core/**` | **95%** | 高风险纯逻辑区 |

阈值在 `vitest.config.ts` 内联，CI 跑 `npx vitest run --coverage` 失败即拒绝合并。
覆盖率报告：`./coverage/index.html`（本地）+ `./coverage/coverage-summary.json`（CI 上传）。

**Phase 2 收紧时机**：单模块掉档 / 引入关键算法（如 T-Spin 识别）时，按文件再加 `functions` `branches` `statements` 子档。MVP 阶段两档够用。

## 4. 待补单测清单（模块到测试到 ≤ 24h 闭环）

| 优先级 | 模块 | 测试要点 | 触发条件 |
|---|---|---|---|
| P0 | `rotation.ts` | 全 28 组 SRS kick offset 数据正确性（含 I-piece 单独表）；5 步踢墙按顺序；逆旋转回退 | 前端交付 src/core/rotation.ts |
| P0 | `randomizer.ts` | 7-bag 每 7 块必含全 7 种；注入 RNG 后确定性；序列可重放 | 前端交付 src/core/randomizer.ts |
| P0 | `lineClear.ts` | 单行 / 双行 / 三行 / Tetris 4 行同时；最后一块触发；空棋盘无消除 | 前端交付 src/core/lineClear.ts |
| P0 | `gameMachine.ts` | 5 状态全覆盖：`idle`→`spawning`→`playing`→`paused`→`gameOver`→`restart`；非法事件忽略；lock delay 重置 | 前端交付 src/core/gameMachine.ts |
| P1 | `collision.ts` | tryMove/tryRotate 各种撞墙/撞块情形（含 SRS 踢墙成功路径） | 前端交付 src/core/collision.ts |
| P1 | `board.ts` | inBounds / isOccupied / 边界 row=23 row=24 buffer | 前端交付 src/core/board.ts |
| P1 | `scoring.ts` | 经典 Tetris 公式（single/double/triple/tetris）；T-Spin Single/Double/Triple；Back-to-Back | 前端交付 src/core/scoring.ts |
| P1 | `lock.ts` | lock delay 计时；移动/旋转重置；15 次上限强制锁定（Tetris Guideline 标准） | 前端交付 src/core/lock.ts |
| P2 | `tetromino.ts` | 7 种 tetromino × 4 旋转 cells 完整性 | 前端交付 src/core/tetromino.ts |
| P2 | `gravity.ts` | level→每帧下落间隔表正确性 | 前端交付 src/core/gravity.ts |
| P3 | `keyboard.ts` | DAS / ARR 行为；多键并发 | 前端交付 src/input/keyboard.ts |
| P3 | `canvasRenderer.ts` | 抽纯函数后测：state → draw commands | 前端交付 src/render/canvasRenderer.ts |

**响应节奏**：前端 push `core/xxx.ts` 后 24h 内，对应 `xxx.test.ts` 必须合入并跑绿。

## 5. E2E 关键路径 7 条（架构 §7.2）

| # | 场景 | 用例入口 | 验证点 |
|---|---|---|---|
| 1 | 启动→idle→Enter→playing | `01-idle-to-playing.spec.ts` | DOM 出现棋盘 + HUD；初始 score=0 level=1 |
| 2 | 移动/旋转/硬降 | `02-move-rotate-hard-drop.spec.ts` | 方块按预期落入棋盘；硬降瞬间落底；lock 触发 spawn 下一块 |
| 3 | 消行 + 计分 | `03-line-clear-score.spec.ts` | 单/双/三/Tetris 各一例；score 按经典公式递增；lines 计数正确 |
| 4 | Hold | `04-hold.spec.ts` | 当前方块进 Hold 区；Hold 区方块上场；本局只能 hold 一次（直到锁） |
| 5 | TopOut → GameOver | `05-top-out-game-over.spec.ts` | 堆到顶无法 spawn → modal 显示 + finalScore |
| 6 | 暂停 / 恢复 | `06-pause-resume.spec.ts` | pause 后 tick(dt) 不推进；resume 后状态连续 |
| 7 | 速度曲线 | `07-level-gravity.spec.ts` | 等级↑ → 下落间隔↓；同 input 下落耗时差异 |

**E2E 不测**：UI 视觉细节、动画时长、字体、配色。

## 6. 断言与代码风格

- **每个 `it` 只验证一件事**；用例名描述行为而非实现（如「按 Enter 从 idle 进入 playing」而非「start action 触发 reducer」）。
- **不在单测里 mock 整个 board**：用 `test/core/helpers/boardFactory.ts` 构造真实最小棋盘喂入。
- **不在单测里 mock randomizer**：用 `seededRng(seed)` 注入确定性 RNG。
- **禁用 `any` / `@ts-ignore`**：测试代码也要过 type-check。
- **失败信息要可读**：用 `expect(x).toEqual(y)` 而非 `toBe` 比较对象；自定义消息写「期望 SRS kick 0→1 第 2 步为 (-1, +1)，实际 (-1, 0)」。

## 7. 协作边界

| 协作对象 | 边界 | 避免冲突 |
|---|---|---|
| 前端工程师 | 我交付测试配置 + 测试代码；他交付 src/ + 选择器约定 | 我不写 src/ 任何代码；他不写 test/ 任何代码 |
| CI/CD 架构师 | 我提供 `vitest.config.ts` + `playwright.config.ts`；他在 workflow 内 `npx vitest run --coverage` 与 `npx playwright test` 调用 | 配置双源 = 不接受；测试脚本来源唯一 |

## 8. 待前端 / CI-CD 跟进的 DevDependencies（清单，待合入 package.json）

测试体系运行所需的 devDependencies（前端在 `package.json` 加，CI/CD 在 lockfile 锁版本）：

```
vitest@^1.6.0
@vitest/coverage-v8@^1.6.0
@playwright/test@^1.44.0
jsdom@^24.0.0           # 仅当某单测需要 DOM 环境（默认不装，按需引入）
```

> 当前 TS 报错「Cannot find module 'vitest' / '@playwright/test'」属预期——依赖未安装即如此。`npm install` 后自动消失。

## 9. 验收红线

- `npx vitest run --coverage` 全绿 + 覆盖率门槛达标 → 单测通过
- `npx playwright test` 全绿（Chromium-only，Phase 2 恢复三浏览器见 playwright.config.ts 注释）→ E2E 通过
- `npm run build` 成功 → 整体通过

任一红线未达 = 不允许合并 main（与 CI/CD 流水线对齐）。
