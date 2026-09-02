// E2E 冒烟骨架 · Stage 0 占位用例：证明 Playwright 通路 + dev server 可达。
// 架构 §7.2 的 7 条关键路径（idle→playing / 移动·旋转·硬降 / 消行 / Hold / TopOut / 暂停 / 速度曲线）
// 由前端交付 src/ui/ + src/app/ 之后，按本文件结构补齐为 7 个独立 .spec.ts。

import { test, expect } from '@playwright/test';
import { press } from './helpers/keyboard';

test.describe('e2e smoke · 占位', () => {
  test('页面加载到 idle 态', async ({ page }) => {
    await page.goto('/');
    // 占位断言：后续由前端确定具体选择器（data-testid="app" / "hud" / "canvas"）
    await expect(page).toHaveTitle(/.+/);
  });

  test('占位：按下 Enter 不报错（验证键盘事件通路）', async ({ page }) => {
    await page.goto('/');
    await press(page, 'start');
    // 真断言（idle→playing 转换）待前端交付 GameOverModal 配套 DOM 后补
  });
});
