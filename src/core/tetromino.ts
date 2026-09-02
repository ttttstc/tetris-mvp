/**
 * core/tetromino.ts
 *
 * Defines the 7 tetromino shapes (I/O/T/S/Z/J/L) and their 4 rotation states.
 *
 * Cell offsets are stored relative to the piece's pivot:
 *   - The pivot is conceptually the "center" of the piece's bounding box.
 *   - For J/L/S/T/Z: pivot is the center of a 3×3 box (1, 1) in local coords.
 *   - For O: pivot is the top-left of its 2×2 box (0.5, 0.5) — but since O does not
 *     rotate, we just store it as a 2×2 block.
 *   - For I: pivot is the center of a 4×4 box — stored at (1.5, 1.5). To keep
 *     integer arithmetic, we use a 4×4 grid with the pivot at the 2nd cell from
 *     the top-left in each axis (offset of (1, 1)).
 *
 * The shape encoding is canonical: these exact offsets are used everywhere a piece
 * is drawn, moved, rotated, and locked. Anyone changing these tables must also
 * update the SRS rotation kick tables in rotation.ts (they assume this layout).
 */

import type { CellOffset, PieceId, RotationState } from './types';

/**
 * Per-rotation cell offsets relative to the piece pivot.
 * Indexable as `SHAPES[id][rotation]` → readonly CellOffset[].
 */
export type ShapeTable = Readonly<Record<PieceId, Readonly<Record<RotationState, readonly CellOffset[]>>>>;

const I: Record<RotationState, readonly CellOffset[]> = {
  // I piece in a 4×4 box. Pivot at the 2nd cell from top-left in each axis.
  0: [{ dx: -1, dy: 0 }, { dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: 2, dy: 0 }], // horizontal, top
  1: [{ dx: 1, dy: -1 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 }, { dx: 1, dy: 2 }], // vertical, right column
  2: [{ dx: -1, dy: 1 }, { dx: 0, dy: 1 }, { dx: 1, dy: 1 }, { dx: 2, dy: 1 }], // horizontal, bottom row
  3: [{ dx: 0, dy: -1 }, { dx: 0, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: 2 }], // vertical, left column
};

const O: Record<RotationState, readonly CellOffset[]> = {
  // O does not rotate; all 4 states identical.
  0: [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 1, dy: 1 }],
  1: [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 1, dy: 1 }],
  2: [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 1, dy: 1 }],
  3: [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 1, dy: 1 }],
};

const T: Record<RotationState, readonly CellOffset[]> = {
  // pivot at center of 3×3 box (1,1) → use offsets -1..+1 around pivot
  0: [{ dx: -1, dy: 0 }, { dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: 0, dy: -1 }],
  1: [{ dx: 0, dy: -1 }, { dx: 0, dy: 0 }, { dx: 0, dy: 1 }, { dx: 1, dy: 0 }],
  2: [{ dx: -1, dy: 0 }, { dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }],
  3: [{ dx: 0, dy: -1 }, { dx: 0, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }],
};

const S: Record<RotationState, readonly CellOffset[]> = {
  0: [{ dx: -1, dy: 0 }, { dx: 0, dy: 0 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 }],
  1: [{ dx: 0, dy: -1 }, { dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 }],
  2: [{ dx: -1, dy: 1 }, { dx: 0, dy: 1 }, { dx: 0, dy: 0 }, { dx: 1, dy: 0 }],
  3: [{ dx: -1, dy: -1 }, { dx: -1, dy: 0 }, { dx: 0, dy: 0 }, { dx: 0, dy: 1 }],
};

const Z: Record<RotationState, readonly CellOffset[]> = {
  0: [{ dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: 0, dy: 0 }, { dx: 1, dy: 0 }],
  1: [{ dx: 0, dy: -1 }, { dx: 1, dy: -1 }, { dx: 0, dy: 0 }, { dx: 1, dy: 1 }],
  2: [{ dx: -1, dy: 0 }, { dx: 0, dy: 0 }, { dx: 0, dy: 1 }, { dx: 1, dy: 1 }],
  3: [{ dx: -1, dy: 1 }, { dx: -1, dy: 0 }, { dx: 0, dy: 0 }, { dx: 0, dy: -1 }],
};

const J: Record<RotationState, readonly CellOffset[]> = {
  0: [{ dx: -1, dy: -1 }, { dx: -1, dy: 0 }, { dx: 0, dy: 0 }, { dx: 1, dy: 0 }],
  1: [{ dx: 0, dy: -1 }, { dx: 1, dy: -1 }, { dx: 0, dy: 0 }, { dx: 0, dy: 1 }],
  2: [{ dx: -1, dy: 0 }, { dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 }],
  3: [{ dx: 0, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 1 }, { dx: 0, dy: -1 }],
};

const L: Record<RotationState, readonly CellOffset[]> = {
  0: [{ dx: 1, dy: -1 }, { dx: -1, dy: 0 }, { dx: 0, dy: 0 }, { dx: 1, dy: 0 }],
  1: [{ dx: 0, dy: -1 }, { dx: 0, dy: 0 }, { dx: 0, dy: 1 }, { dx: 1, dy: 1 }],
  2: [{ dx: -1, dy: 0 }, { dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: -1, dy: 1 }],
  3: [{ dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: 0, dy: 0 }, { dx: 0, dy: 1 }],
};

/**
 * Canonical shape table. Every render, move, rotate, and lock in the game goes
 * through this table. Do not duplicate per-module shape tables.
 */
export const SHAPES: ShapeTable = {
  I,
  O,
  T,
  S,
  Z,
  J,
  L,
};

/** Convenience: cells for a given piece + rotation. */
export function cellsFor(id: PieceId, rotation: RotationState): readonly CellOffset[] {
  return SHAPES[id][rotation];
}

/**
 * Absolute cell positions for an active piece on the board.
 * Returns an array of (x, y) tuples in board coordinates.
 */
export function pieceCells(piece: { id: PieceId; rotation: RotationState; x: number; y: number }): readonly CellOffset[] {
  const cells = cellsFor(piece.id, piece.rotation);
  return cells.map((c) => ({ dx: piece.x + c.dx, dy: piece.y + c.dy }));
}

/** Number of distinct rotation states for any piece (always 4; included for symmetry with shape tables). */
export const ROTATION_STATES: readonly RotationState[] = [0, 1, 2, 3];
