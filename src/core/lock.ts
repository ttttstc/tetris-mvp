/**
 * core/lock.ts
 *
 * Lock logic — decides whether a piece should lock this tick, and handles the
 * classic "infinite-spin" guard by capping lock-delay resets.
 *
 * The lock-delay state lives in the game state machine (see gameMachine.ts);
 * this module only contains pure helpers.
 */

import { LOCK_DELAY_MS, MAX_LOCK_RESETS } from './gravity';
import { tryMove, collides } from './collision';
import type { ActivePiece, Board } from './types';

/**
 * Has the piece been "grounded" — i.e., can it not move down any further?
 * True when tryMove(0, 1) returns null.
 */
export function isGrounded(board: Board, piece: ActivePiece): boolean {
  return tryMove(board, piece, 0, 1) === null;
}

/**
 * Has the lock timer run out? Caller passes the accumulated ms since the piece
 * first touched the ground (or last had its lock timer reset).
 */
export function lockTimerExpired(lockTimerMs: number): boolean {
  return lockTimerMs >= LOCK_DELAY_MS;
}

/** True if the player has used up their last lock-reset; further moves cannot extend. */
export function lockResetsExhausted(resetsLeft: number): boolean {
  return resetsLeft <= 0;
}

/** How many resets remain for this piece's lock delay. */
export function initialLockResets(): number {
  return MAX_LOCK_RESETS;
}

/**
 * Compute the number of resets left after a successful move that re-grounds.
 * Caps at 0 (i.e. never negative).
 */
export function consumeLockReset(current: number): number {
  return Math.max(0, current - 1);
}

/**
 * Helper: determine if a piece is locked in place — i.e., grounded AND the
 * lock timer has expired (or resets are exhausted). Useful for tests.
 */
export function pieceIsLocked(board: Board, piece: ActivePiece, lockTimerMs: number, resetsLeft: number): boolean {
  if (!collides(board, piece) && !isGrounded(board, piece)) return false;
  if (lockResetsExhausted(resetsLeft)) return true;
  return lockTimerExpired(lockTimerMs);
}
