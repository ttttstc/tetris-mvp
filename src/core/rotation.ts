/**
 * core/rotation.ts
 *
 * Super Rotation System (SRS) kick tables. This file is the SINGLE SOURCE OF TRUTH
 * for wall-kick offsets. Touching any number here without re-running the test suite
 * (`src/core/rotation.test.ts`) is the fastest way to break Tetris.
 *
 * -----------------------------------------------------------------------------
 * DATA SOURCES (consult these before editing)
 * -----------------------------------------------------------------------------
 * Primary reference (canonical, machine-readable):
 *   - Tetris Wiki — Super Rotation System:
 *     https://tetris.wiki/wiki/Super_Rotation_System
 *   - Tetris Wiki — Wall Kick:
 *     https://tetris.wiki/wiki/Wall_kick
 *
 * Authoritative source (the actual rulebook):
 *   - The Tetris Online Japan 2009 "Tetris Guideline" specification:
 *     https://tetris.wiki/images/9/93/2009_Tetris_Guideline_Tetris_Online_Japan.pdf
 *     Section 7 ("Rotation System") and Appendix B ("Wall Kick Data").
 *
 * Secondary (cross-check; pre-Guideline; mostly matches):
 *   - Tetris Wiki — Tetris (SRS):
 *     https://tetris.wiki/wiki/Tetris
 *
 * Each constant below is named to mirror the source tables exactly:
 *   - KICKS_JLSTZ[`"0->1"`] is the kick sequence for JLSTZ pieces rotating from
 *     spawn state (0) one quarter turn clockwise to state 1 (R). Each entry is a
 *     (dx, dy) candidate the engine tries in order. dy uses the convention
 *     "down is positive" (matches our board coordinate system).
 *
 * The 28 here refers to the 28 non-trivial kick offsets after the trivial (0, 0)
 * test is removed: 7 pieces (excluding O) × 4 transitions = 28. (The full table is
 * 8 transitions × 5 tests = 40 entries per family; 28 of those are non-zero and
 * correspond to what players experience as "kicks".)
 */

import type { KickOffset, PieceId, RotationState } from './types';

/**
 * Number of candidate kick offsets per rotation transition. Always 5: the trivial
 * (0, 0) plus 4 wall/edge kicks per the Tetris Online Japan specification.
 */
export const KICKS_PER_TRANSITION = 5;

/** JLSTZ (J, L, S, T, Z) kick tables. Each transition has exactly 5 candidates. */
export const KICKS_JLSTZ: Readonly<Record<string, readonly KickOffset[]>> = {
  // 0 -> R (spawn → one CW turn)
  '0->1': [
    { dx: 0, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: -1, dy: +1 },
    { dx: 0, dy: -2 },
    { dx: -1, dy: -2 },
  ],
  // R -> 0 (one CW turn → back to spawn, equivalent to 0 -> L but mirrored)
  '1->0': [
    { dx: 0, dy: 0 },
    { dx: +1, dy: 0 },
    { dx: +1, dy: -1 },
    { dx: 0, dy: +2 },
    { dx: +1, dy: +2 },
  ],
  // R -> 2 (one CW turn → 180°)
  '1->2': [
    { dx: 0, dy: 0 },
    { dx: +1, dy: 0 },
    { dx: +1, dy: -1 },
    { dx: 0, dy: +2 },
    { dx: +1, dy: +2 },
  ],
  // 2 -> R (180° → one CW turn back)
  '2->1': [
    { dx: 0, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: -1, dy: +1 },
    { dx: 0, dy: -2 },
    { dx: -1, dy: -2 },
  ],
  // 2 -> L (180° → one CCW turn)
  '2->3': [
    { dx: 0, dy: 0 },
    { dx: +1, dy: 0 },
    { dx: +1, dy: +1 },
    { dx: 0, dy: -2 },
    { dx: +1, dy: -2 },
  ],
  // L -> 2 (one CCW turn → 180°)
  '3->2': [
    { dx: 0, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: -1, dy: -1 },
    { dx: 0, dy: +2 },
    { dx: -1, dy: +2 },
  ],
  // L -> 0 (one CCW turn → back to spawn)
  '3->0': [
    { dx: 0, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: -1, dy: -1 },
    { dx: 0, dy: +2 },
    { dx: -1, dy: +2 },
  ],
  // 0 -> L (spawn → one CCW turn)
  '0->3': [
    { dx: 0, dy: 0 },
    { dx: +1, dy: 0 },
    { dx: +1, dy: +1 },
    { dx: 0, dy: -2 },
    { dx: +1, dy: -2 },
  ],
} as const;

/** I-piece kick tables. Same 8 transitions, different offsets per the Guideline spec. */
export const KICKS_I: Readonly<Record<string, readonly KickOffset[]>> = {
  '0->1': [
    { dx: 0, dy: 0 },
    { dx: -2, dy: 0 },
    { dx: +1, dy: 0 },
    { dx: -2, dy: -1 },
    { dx: +1, dy: +2 },
  ],
  '1->0': [
    { dx: 0, dy: 0 },
    { dx: +2, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: +2, dy: +1 },
    { dx: -1, dy: -2 },
  ],
  '1->2': [
    { dx: 0, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: +2, dy: 0 },
    { dx: -1, dy: +2 },
    { dx: +2, dy: -1 },
  ],
  '2->1': [
    { dx: 0, dy: 0 },
    { dx: +1, dy: 0 },
    { dx: -2, dy: 0 },
    { dx: +1, dy: -2 },
    { dx: -2, dy: +1 },
  ],
  '2->3': [
    { dx: 0, dy: 0 },
    { dx: +2, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: +2, dy: +1 },
    { dx: -1, dy: -2 },
  ],
  '3->2': [
    { dx: 0, dy: 0 },
    { dx: -2, dy: 0 },
    { dx: +1, dy: 0 },
    { dx: -2, dy: -1 },
    { dx: +1, dy: +2 },
  ],
  '3->0': [
    { dx: 0, dy: 0 },
    { dx: +1, dy: 0 },
    { dx: -2, dy: 0 },
    { dx: +1, dy: -2 },
    { dx: -2, dy: +1 },
  ],
  '0->3': [
    { dx: 0, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: +2, dy: 0 },
    { dx: -1, dy: +2 },
    { dx: +2, dy: -1 },
  ],
} as const;

/** All transition keys present in both tables, for validation in tests. */
export const ALL_TRANSITIONS: readonly string[] = [
  '0->1', '1->0', '1->2', '2->1', '2->3', '3->2', '3->0', '0->3',
] as const;

/** Total transitions × 5 candidates = 40 entries per family, 80 entries overall. */
export function getKickTable(id: PieceId): Readonly<Record<string, readonly KickOffset[]>> {
  return id === 'I' ? KICKS_I : KICKS_JLSTZ;
}

/**
 * Compute the next rotation state given current state and direction.
 *  1 → clockwise (0→1, 1→2, 2→3, 3→0)
 * -1 → counter-clockwise (0→3, 3→2, 2→1, 1→0)
 */
export function nextRotation(current: RotationState, dir: 1 | -1): RotationState {
  const n = (current + dir + 4) % 4;
  return n as RotationState;
}

/**
 * The O piece does not rotate — calling tryRotate on an O is a no-op.
 * Centralized here so callers don't need to special-case.
 */
export function isPieceRotationAllowed(id: PieceId): boolean {
  return id !== 'O';
}
