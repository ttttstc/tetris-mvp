/**
 * core/gravity.ts
 *
 * Classic NES-style gravity curve, with a per-level down-interval table.
 * Modern Guideline uses a different formula; this is the classic one because
 * the director asked for "经典 Tetris" (classic Tetris) and the MVP doesn't need
 * 20G or sub-second late-game speed.
 *
 *  Level 1: 1000 ms / cell
 *  Level 2:  850 ms / cell
 *  Level 3:  700 ms / cell
 *  ...
 *  Level 9:  100 ms / cell
 *  Level 10+: 50 ms / cell (cap)
 *
 * Source (NES Tetris gravity table): https://tetris.wiki/wiki/Tetris_(NES,_Nintendo)
 */

const CLASSIC_TABLE: readonly number[] = [
  1000, // 1
  850,  // 2
  700,  // 3
  600,  // 4
  500,  // 5
  400,  // 6
  300,  // 7
  200,  // 8
  100,  // 9
  50,   // 10
];

/** Milliseconds per gravity step at a given level (1-indexed). Capped at level 10. */
export function gravityMs(level: number): number {
  const idx = Math.max(0, Math.min(level - 1, CLASSIC_TABLE.length - 1));
  return CLASSIC_TABLE[idx]!;
}

/**
 * Soft-drop multiplier: pressing down moves at this rate (ms per cell).
 * Per the architecture §3 (input layer), this is a tunable constant in the
 * classic feel range.
 */
export const SOFT_DROP_MS = 50;

/** Lock delay: time after the piece becomes grounded before it locks. */
export const LOCK_DELAY_MS = 500;

/**
 * Maximum lock-delay resets per piece (prevents infinite rotation-into-floor
 * exploits). 15 matches the Tetris Guideline default.
 */
export const MAX_LOCK_RESETS = 15;

/**
 * Decide, given accumulated time and a gravity interval, whether the piece
 * should fall one cell this tick. Pure: returns true if gravity should apply.
 */
export function shouldGravityStep(accumMs: number, intervalMs: number): boolean {
  return accumMs >= intervalMs;
}
