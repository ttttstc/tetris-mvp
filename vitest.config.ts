// Vitest configuration for Tetris MVP
// 架构约束：src/core/ 零外部依赖、可在 Node 直跑；src/input/ 抽 mapper；src/render/ 抽纯函数。
// UI 层（Svelte 组件）由 Playwright E2E 覆盖，不进此配置。
// CI 工作流直接 `pnpm test:coverage` 即可，共用此配置避免双源。

// 注：include 同时覆盖 src/**/*.test.ts（前端 colocation 测试）和 test/core/**/*.test.ts（测试工程师的骨架/示例）。
// 这是合并两线测试产物后的最终版本。director 已签字接受 core/ ≥ 95% 立场 A。

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'test/core/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'test/e2e/**'],

    // core/ + input/ + render/ 纯逻辑 → Node 环境即可
    environment: 'node',

    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'json', 'html'],
      reportsDirectory: './coverage',

      // src/core/ 是项目唯一高风险纯逻辑区，门禁最严
      include: ['src/core/**', 'src/input/**', 'src/render/**'],
      exclude: ['src/**/*.test.ts', 'src/**/*.d.ts', 'src/**/index.ts', 'src/core/types.ts'],

      // 架构指标：core/ ≥ 95% lines，全仓（src/）≥ 80% lines（两档）。
      // 双源防御：CI workflow 卡门禁，本地 `pnpm test:coverage` 同样 fail-fast（避免 CI 脚本错时漏卡）。
      // 单模块掉档或 Phase 2 加严时，再展开 functions/branches/statements 子档。
      thresholds: {
        // 全局门槛
        lines: 80,
        // core/ 子目录门槛（v8 支持 per-file glob）
        'src/core/**': {
          lines: 95,
        },
      },
    },
  },

  resolve: {
    alias: {
      '@core': new URL('./src/core/', import.meta.url).pathname,
      '@input': new URL('./src/input/', import.meta.url).pathname,
      '@render': new URL('./src/render/', import.meta.url).pathname,
    },
  },
});