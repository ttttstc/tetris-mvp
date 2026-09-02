// 键盘 → Playwright key 名映射
// 架构约定：keyboard.ts 内部做 DAS/ARR，单测只喂抽象 InputAction；E2E 用真实键盘事件。
// ponrail: 只映射游戏实际用到的键，不做通用 helper 库。

import type { Page } from '@playwright/test';

export const KEYS = {
  left: 'ArrowLeft',
  right: 'ArrowRight',
  softDrop: 'ArrowDown',
  hardDrop: 'Space',
  rotateCW: 'ArrowUp',
  rotateCCW: 'KeyZ',
  hold: 'KeyC',
  pause: 'KeyP',
  start: 'Enter',
} as const;

export type GameKey = keyof typeof KEYS;

/** 物理按键按下：避免 Playwright 默认的 click 等动作污染输入流 */
export async function press(page: Page, key: GameKey): Promise<void> {
  await page.keyboard.press(KEYS[key]);
}

/** 长按软降：传毫秒数 */
export async function holdSoftDrop(page: Page, ms: number): Promise<void> {
  await page.keyboard.down(KEYS.softDrop);
  await page.waitForTimeout(ms);
  await page.keyboard.up(KEYS.softDrop);
}
