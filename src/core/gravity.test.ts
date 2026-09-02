/**
 * src/core/gravity.test.ts
 */
import { describe, it, expect } from 'vitest';
import { gravityMs, SOFT_DROP_MS, LOCK_DELAY_MS, MAX_LOCK_RESETS, shouldGravityStep } from './gravity';

describe('gravity', () => {
  it('returns 1000ms at level 1', () => {
    expect(gravityMs(1)).toBe(1000);
  });
  it('decreases monotonically', () => {
    let prev = gravityMs(1);
    for (let l = 2; l <= 10; l++) {
      const cur = gravityMs(l);
      expect(cur).toBeLessThanOrEqual(prev);
      prev = cur;
    }
  });
  it('caps at level 10 (or beyond)', () => {
    expect(gravityMs(10)).toBe(50);
    expect(gravityMs(20)).toBe(50);
  });
  it('exposes classic constants', () => {
    expect(SOFT_DROP_MS).toBe(50);
    expect(LOCK_DELAY_MS).toBe(500);
    expect(MAX_LOCK_RESETS).toBe(15);
  });
  it('shouldGravityStep is true when accum >= interval', () => {
    expect(shouldGravityStep(999, 1000)).toBe(false);
    expect(shouldGravityStep(1000, 1000)).toBe(true);
    expect(shouldGravityStep(1500, 1000)).toBe(true);
  });
});
