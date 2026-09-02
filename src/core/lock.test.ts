/**
 * src/core/lock.test.ts
 */
import { describe, it, expect } from 'vitest';
import { isGrounded, lockTimerExpired, lockResetsExhausted, consumeLockReset, initialLockResets } from './lock';
import { LOCK_DELAY_MS } from './gravity';
import { createBoard } from './board';
import { VISIBLE_TOP } from './types';

describe('lock', () => {
  it('isGrounded: piece is grounded when cannot move down', () => {
    const b = createBoard();
    const inAir = { id: 'O' as const, rotation: 0 as const, x: 4, y: VISIBLE_TOP };
    // At y = VISIBLE_TOP + 19 (row 21): O occupies rows 21, 22. Both in bounds → can move to y=22.
    expect(isGrounded(b, { id: 'O' as const, rotation: 0 as const, x: 4, y: VISIBLE_TOP + 19 })).toBe(false);
    // At y = VISIBLE_TOP + 20 (row 22): O occupies rows 22, 23. canMove to 23 → rows 23, 24 → row 24 OOB.
    expect(isGrounded(b, { id: 'O' as const, rotation: 0 as const, x: 4, y: VISIBLE_TOP + 20 })).toBe(true);
    expect(isGrounded(b, inAir)).toBe(false);
  });

  it('lockTimerExpired after LOCK_DELAY_MS', () => {
    expect(lockTimerExpired(LOCK_DELAY_MS)).toBe(true);
    expect(lockTimerExpired(LOCK_DELAY_MS - 1)).toBe(false);
  });

  it('lockResetsExhausted', () => {
    expect(lockResetsExhausted(0)).toBe(true);
    expect(lockResetsExhausted(1)).toBe(false);
  });

  it('consumeLockReset decrements but never goes below 0', () => {
    expect(consumeLockReset(2)).toBe(1);
    expect(consumeLockReset(0)).toBe(0);
    expect(consumeLockReset(1)).toBe(0);
  });

  it('initialLockResets returns the configured max', () => {
    expect(initialLockResets()).toBeGreaterThan(0);
  });
});
