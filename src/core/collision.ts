/**
 * core/collision.ts
 *
 * Collision detection and SRS rotation. Pure functions; no side effects on the
 * board beyond what the caller decides. The game state machine calls these and
 * applies the results.
 *
 * Conventions:
 *   - dx, dy follow the "down is positive" rule of the board coordinate system.
 *   - All piece reads use the canonical SHAPES table from tetromino.ts.
 */

import { isOccupied, inBounds } from './board';
import { pieceCells } from './tetromino';
import { getKickTable, isPieceRotationAllowed, nextRotation, ALL_TRANSITIONS } from './rotation';
import type { ActivePiece, Board } from './types';

/**
 * Check whether the piece at its current position overlaps any occupied cell or
 * sits out of bounds. Used by tryMove, tryRotate, and spawn.
 */
export function collides(board: Board, piece: ActivePiece): boolean {
  const cells = pieceCells(piece);
  for (const c of cells) {
    if (!inBounds(c.dx, c.dy)) return true;
    if (isOccupied(board, c.dx, c.dy)) return true;
  }
  return false;
}

/**
 * Try to move the piece by (dx, dy). Returns the new piece on success, or null
 * if the move is blocked. Caller decides whether to apply soft-drop gravity on
 * a blocked vertical move (i.e. trigger lock).
 */
export function tryMove(
  board: Board,
  piece: ActivePiece,
  dx: number,
  dy: number,
): ActivePiece | null {
  const next: ActivePiece = { ...piece, x: piece.x + dx, y: piece.y + dy };
  if (collides(board, next)) return null;
  return next;
}

/**
 * Try to rotate the piece. Returns:
 *   - { ok: true, piece } if rotation succeeded (the piece is in its new rotation
 *     and possibly nudged by an SRS kick)
 *   - { ok: false } if no kick offset landed in a legal position. The piece is
 *     unchanged.
 *
 * Implements Super Rotation System:
 *   - Try the trivial (0, 0) offset first.
 *   - Then the 4 wall/edge kicks, in order, until one lands.
 *   - The O piece returns ok=false (it cannot rotate).
 */
export function tryRotate(
  board: Board,
  piece: ActivePiece,
  dir: 1 | -1,
): { ok: true; piece: ActivePiece; kicksApplied: number } | { ok: false } {
  if (!isPieceRotationAllowed(piece.id)) return { ok: false };

  const target = nextRotation(piece.rotation, dir);
  const table = getKickTable(piece.id);

  // Find the correct transition key for "from -> to". dir=1 → 0->1, 1->2, ...
  // dir=-1 → 0->3, 3->2, ...
  const transitionKey = `${piece.rotation}->${target}`;
  let candidates = table[transitionKey];
  if (!candidates) {
    // Fallback: derive the transition key from the inverse rotation. Should
    // never trigger — ALL_TRANSITIONS covers every legal from→to pair — but
    // we keep a defensive fallback for future table extension.
    const fallbackKey = `${piece.rotation}->${dir === 1 ? (piece.rotation + 1) % 4 : (piece.rotation + 3) % 4}`;
    candidates = table[fallbackKey];
  }
  if (!candidates) return { ok: false };

  for (let i = 0; i < candidates.length; i++) {
    const k = candidates[i]!;
    const candidate: ActivePiece = { ...piece, rotation: target, x: piece.x + k.dx, y: piece.y + k.dy };
    if (!collides(board, candidate)) {
      return { ok: true, piece: candidate, kicksApplied: i };
    }
  }
  return { ok: false };
}

/**
 * Hard-drop: drop the piece as far down as it will go without colliding.
 * Returns the dropped piece (never null — at minimum, the piece does not move).
 */
export function hardDrop(board: Board, piece: ActivePiece): ActivePiece {
  let current = piece;
  while (true) {
    const next = tryMove(board, current, 0, 1);
    if (next === null) break;
    current = next;
  }
  return current;
}

/**
 * Compute the "ghost" piece position — where the active piece would land if
 * hard-dropped. Used to render a translucent preview on the board.
 */
export function ghostPosition(board: Board, piece: ActivePiece): ActivePiece {
  return hardDrop(board, piece);
}

/** Diagnostic helper: enumerate every transition key expected by SRS. */
export const EXPECTED_TRANSITIONS = ALL_TRANSITIONS;
