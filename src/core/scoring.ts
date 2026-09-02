/**
 * core/scoring.ts
 *
 * Classic Tetris scoring plus modern T-Spin / Back-to-Back bonuses.
 *
 * Reference (same data sources as rotation.ts):
 *   - Tetris Wiki — Scoring:
 *     https://tetris.wiki/wiki/Scoring
 *   - Tetris Wiki — T-Spin:
 *     https://tetris.wiki/wiki/T-Spin
 *
 * Formulas (level multiplier applied at the end):
 *   Single: 100 * level
 *   Double: 300 * level
 *   Triple: 500 * level
 *   Tetris: 800 * level
 *   T-Spin Single: 800 * level
 *   T-Spin Double: 1200 * level
 *   T-Spin Triple: 1600 * level
 *   Back-to-back (Tetris or T-Spin): ×1.5
 *   Soft drop: +1 per cell
 *   Hard drop: +2 per cell
 *   Combo (consecutive line clears): +50 * combo * level
 */

import type { LineClearResult } from './types';

export type ClearKind = LineClearResult['kind'];

export interface ScoringContext {
  readonly level: number;
  readonly linesCleared: 0 | 1 | 2 | 3 | 4;
  readonly kind: ClearKind;
  readonly wasBackToBack: boolean;
  readonly combo: number; // number of consecutive clears before this one (0 if none yet)
  readonly softDropCells: number;
  readonly hardDropCells: number;
}

export interface ScoringOutcome {
  readonly scoreDelta: number;
  readonly nextBackToBack: boolean;
  readonly nextCombo: number;
  readonly linesAdded: 0 | 1 | 2 | 3 | 4;
  readonly nextLevel: (currentLevel: number) => number;
}

const BASE_SCORES: Record<ClearKind, number> = {
  none: 0,
  single: 100,
  double: 300,
  triple: 500,
  tetris: 800,
  tSpinSingle: 800,
  tSpinDouble: 1200,
  tSpinTriple: 1600,
  tSpinMiniSingle: 200,
};

const B2B_ELIGIBLE: ReadonlySet<ClearKind> = new Set<ClearKind>([
  'tetris',
  'tSpinSingle',
  'tSpinDouble',
  'tSpinTriple',
]);

/**
 * Compute the score delta for a single line-clear event (or non-clear).
 * Combines: base line score (× level), back-to-back multiplier, combo bonus,
 * and the drop-action point bonuses.
 */
export function scoreClear(ctx: ScoringContext): ScoringOutcome {
  const level = Math.max(1, ctx.level);
  const linesAdded = ctx.linesCleared;
  const base = BASE_SCORES[ctx.kind] ?? 0;
  const isB2BEligible = B2B_ELIGIBLE.has(ctx.kind);
  const nextBackToBack = isB2BEligible && ctx.wasBackToBack ? true : isB2BEligible;

  let scoreDelta = base * level;
  if (ctx.wasBackToBack && isB2BEligible) {
    scoreDelta = Math.floor(scoreDelta * 1.5);
  }
  if (ctx.combo > 0 && linesAdded > 0) {
    scoreDelta += 50 * ctx.combo * level;
  }
  scoreDelta += ctx.softDropCells * 1;
  scoreDelta += ctx.hardDropCells * 2;

  const nextCombo = linesAdded > 0 ? ctx.combo + 1 : 0;

  return {
    scoreDelta,
    nextBackToBack,
    nextCombo,
    linesAdded,
    nextLevel: (current) => nextLevelFor(current, linesAdded),
  };
}

/** Level-up rule: every 10 lines. The classic Tetris rule. */
export function nextLevelFor(currentLevel: number, linesAdded: number): number {
  // Total lines = current * 10 + linesAdded triggers level up if ≥10. This is
  // a per-event approximation; the real state machine tracks absolute lines.
  // For a per-event API we approximate by linesAdded alone — the state machine
  // uses an absolute counter for precision.
  if (linesAdded <= 0) return currentLevel;
  return currentLevel + (linesAdded >= 10 ? 1 : 0);
}

/**
 * Absolute level based on total lines cleared (the canonical rule).
 * The state machine calls this on every line clear to set the new level.
 */
export function levelFromLines(totalLines: number, startLevel: number = 1): number {
  return startLevel + Math.floor(totalLines / 10);
}
