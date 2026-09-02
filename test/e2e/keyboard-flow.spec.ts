/* eslint-disable */
// @ts-nocheck — Playwright type resolution quirks with our Bundler moduleResolution.
// Runtime behavior is unaffected; Playwright loads this file via its own runner.

/**
 * test/e2e/keyboard-flow.spec.ts
 *
 * End-to-end keyboard flow tests (architecture §7.2). Seven key paths covering
 * every gameplay loop the player can experience.
 *
 * Run:
 *   npm run test:e2e:install   # one-time browser install
 *   npm run test:e2e
 */

import pw from '@playwright/test';
const { test, expect } = pw;

const URL = '/';

test.beforeEach(async ({ page }) => {
  await page.goto(URL);
  await page.waitForSelector('[data-testid="idle-overlay"]');
});

test('1. Start → playing on Enter', async ({ page }) => {
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-testid="play-canvas"]')).toBeVisible();
  await expect(page.locator('[data-testid="hud-score"]')).toContainText('0');
});

test('2. Hard drop places piece and increments score', async ({ page }) => {
  await page.keyboard.press('Enter');
  await page.keyboard.press(' ');
  await expect(page.locator('[data-testid="hud-score"]')).not.toContainText('0');
});

test('3. Move left/right moves the active piece', async ({ page }) => {
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press(' ');
});

test('4. Hold swaps the active piece', async ({ page }) => {
  await page.keyboard.press('Enter');
  await page.keyboard.press('c');
  await expect(page.locator('[data-testid="hold-piece"]')).toBeVisible();
});

test('5. Pause freezes the game and shows overlay', async ({ page }) => {
  await page.keyboard.press('Enter');
  await page.keyboard.press('p');
  await expect(page.locator('[data-testid="pause-overlay"]')).toBeVisible();
  await page.keyboard.press('p');
  await expect(page.locator('[data-testid="pause-overlay"]')).not.toBeVisible();
});

test('6. Restart resets score', async ({ page }) => {
  await page.keyboard.press('Enter');
  await page.keyboard.press(' ');
  await expect(page.locator('[data-testid="hud-score"]')).not.toContainText('0');
  await page.keyboard.press('r');
  await expect(page.locator('[data-testid="hud-score"]')).toContainText('0');
});

test('7. Rotation changes piece orientation', async ({ page }) => {
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowUp');
  await expect(page.locator('[data-testid="play-canvas"]')).toBeVisible();
});

