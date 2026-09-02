// Playwright configuration for Tetris MVP
// E2E 覆盖架构 §7.2 关键路径 7 条：idle→playing、移动/旋转/硬降、消行计分、Hold、TopOut、暂停、速度曲线。
// UI 视觉细节不测（visual regression 超 MVP 范围）。
// CI 工作流直接 `pnpm test:e2e` 即可，共用此配置避免双源。

import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT ?? 4173);
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './test/e2e',
  testMatch: '**/*.spec.ts',
  // 单测放在 src/**/*.test.ts 或 test/core/，E2E 放 test/e2e/，互不串扰
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,

  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // 物理按键直接传到页面，避免 Playwright 键位映射差异
    actionTimeout: 5_000,
    navigationTimeout: 10_000,
  },

  // Chromium-only（MVP）：与 CI/CD 委派 C 对齐，CI 减半避免拉 firefox/webkit 浏览器安装成本。
  // Phase 2 跨浏览器回归时，取消下面三段注释即恢复三浏览器矩阵：
  //   { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  //   { name: 'webkit',  use: { ...devices['Desktop Safari']  } },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  // 本地与 CI 共用：CI 下前端 preview server 由 workflow 自启；本地由 playwright 自动拉起
  webServer: {
    command: 'npm run build && npm run preview',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});