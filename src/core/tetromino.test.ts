/**
 * src/core/tetromino.test.ts
 */
import { describe, it, expect } from 'vitest';
import { SHAPES, cellsFor, pieceCells } from './tetromino';
import { ALL_PIECE_IDS } from './types';

describe('tetromino shapes', () => {
  for (const id of ALL_PIECE_IDS) {
    it(`${id} has 4 cells in every rotation`, () => {
      for (let r = 0; r < 4; r++) {
        expect(SHAPES[id][r as 0 | 1 | 2 | 3]).toHaveLength(4);
        expect(cellsFor(id, r as 0 | 1 | 2 | 3)).toHaveLength(4);
      }
    });
  }

  it('O piece cells are the same across rotations', () => {
    const o0 = SHAPES.O[0];
    for (let r = 1; r < 4; r++) {
      expect(SHAPES.O[r as 0 | 1 | 2 | 3]).toEqual(o0);
    }
  });

  it('pieceCells returns absolute coordinates', () => {
    const cells = pieceCells({ id: 'O', rotation: 0, x: 5, y: 10 });
    expect(cells).toHaveLength(4);
    expect(cells.every((c) => c.dx >= 5 && c.dx <= 6 && c.dy >= 10 && c.dy <= 11)).toBe(true);
  });

  it('T piece spawn state contains the central top bump', () => {
    // T rotation 0: 4 cells around pivot (1,1), with the bump at top middle.
    const t0 = SHAPES.T[0];
    // The bump must be at (0, -1) relative to pivot.
    const hasBump = t0.some((c) => c.dx === 0 && c.dy === -1);
    expect(hasBump).toBe(true);
  });

  it('I piece spawn is horizontal at top of its 4x4 box', () => {
    const i0 = SHAPES.I[0];
    // All cells should share dy=0.
    expect(i0.every((c) => c.dy === 0)).toBe(true);
    expect(i0.map((c) => c.dx).sort()).toEqual([-1, 0, 1, 2]);
  });
});
