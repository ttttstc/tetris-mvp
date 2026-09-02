/**
 * src/core/rotation.test.ts
 *
 * Verifies every entry of KICKS_JLSTZ and KICKS_I against the canonical Tetris
 * Wiki / Guideline values. This is the architect's "project唯一高风险数据源" —
 * touching rotation.ts without updating this file is the fastest way to break
 * Tetris.
 */

import { describe, it, expect } from 'vitest';
import { KICKS_I, KICKS_JLSTZ, ALL_TRANSITIONS, nextRotation, isPieceRotationAllowed } from './rotation';

describe('SRS rotation kick tables', () => {
  it('KICKS_JLSTZ has exactly 5 entries per transition for all 8 transitions', () => {
    expect(Object.keys(KICKS_JLSTZ).sort()).toEqual([...ALL_TRANSITIONS].sort());
    for (const key of ALL_TRANSITIONS) {
      expect(KICKS_JLSTZ[key]).toHaveLength(5);
    }
  });

  it('KICKS_I has exactly 5 entries per transition for all 8 transitions', () => {
    expect(Object.keys(KICKS_I).sort()).toEqual([...ALL_TRANSITIONS].sort());
    for (const key of ALL_TRANSITIONS) {
      expect(KICKS_I[key]).toHaveLength(5);
    }
  });

  it('KICKS_JLSTZ: 0->1 entries match the Guideline', () => {
    expect(KICKS_JLSTZ['0->1']).toEqual([
      { dx: 0, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: -1, dy: +1 },
      { dx: 0, dy: -2 },
      { dx: -1, dy: -2 },
    ]);
  });

  it('KICKS_JLSTZ: 1->0 entries match the Guideline', () => {
    expect(KICKS_JLSTZ['1->0']).toEqual([
      { dx: 0, dy: 0 },
      { dx: +1, dy: 0 },
      { dx: +1, dy: -1 },
      { dx: 0, dy: +2 },
      { dx: +1, dy: +2 },
    ]);
  });

  it('KICKS_JLSTZ: 1->2 entries match the Guideline', () => {
    expect(KICKS_JLSTZ['1->2']).toEqual([
      { dx: 0, dy: 0 },
      { dx: +1, dy: 0 },
      { dx: +1, dy: -1 },
      { dx: 0, dy: +2 },
      { dx: +1, dy: +2 },
    ]);
  });

  it('KICKS_JLSTZ: 2->1 entries match the Guideline', () => {
    expect(KICKS_JLSTZ['2->1']).toEqual([
      { dx: 0, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: -1, dy: +1 },
      { dx: 0, dy: -2 },
      { dx: -1, dy: -2 },
    ]);
  });

  it('KICKS_JLSTZ: 2->3 entries match the Guideline', () => {
    expect(KICKS_JLSTZ['2->3']).toEqual([
      { dx: 0, dy: 0 },
      { dx: +1, dy: 0 },
      { dx: +1, dy: +1 },
      { dx: 0, dy: -2 },
      { dx: +1, dy: -2 },
    ]);
  });

  it('KICKS_JLSTZ: 3->2 entries match the Guideline', () => {
    expect(KICKS_JLSTZ['3->2']).toEqual([
      { dx: 0, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: -1, dy: -1 },
      { dx: 0, dy: +2 },
      { dx: -1, dy: +2 },
    ]);
  });

  it('KICKS_JLSTZ: 3->0 entries match the Guideline', () => {
    expect(KICKS_JLSTZ['3->0']).toEqual([
      { dx: 0, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: -1, dy: -1 },
      { dx: 0, dy: +2 },
      { dx: -1, dy: +2 },
    ]);
  });

  it('KICKS_JLSTZ: 0->3 entries match the Guideline', () => {
    expect(KICKS_JLSTZ['0->3']).toEqual([
      { dx: 0, dy: 0 },
      { dx: +1, dy: 0 },
      { dx: +1, dy: +1 },
      { dx: 0, dy: -2 },
      { dx: +1, dy: -2 },
    ]);
  });

  it('KICKS_I: 0->1 entries match the Guideline', () => {
    expect(KICKS_I['0->1']).toEqual([
      { dx: 0, dy: 0 },
      { dx: -2, dy: 0 },
      { dx: +1, dy: 0 },
      { dx: -2, dy: -1 },
      { dx: +1, dy: +2 },
    ]);
  });

  it('KICKS_I: 1->0 entries match the Guideline', () => {
    expect(KICKS_I['1->0']).toEqual([
      { dx: 0, dy: 0 },
      { dx: +2, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: +2, dy: +1 },
      { dx: -1, dy: -2 },
    ]);
  });

  it('KICKS_I: 1->2 entries match the Guideline', () => {
    expect(KICKS_I['1->2']).toEqual([
      { dx: 0, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: +2, dy: 0 },
      { dx: -1, dy: +2 },
      { dx: +2, dy: -1 },
    ]);
  });

  it('KICKS_I: 2->1 entries match the Guideline', () => {
    expect(KICKS_I['2->1']).toEqual([
      { dx: 0, dy: 0 },
      { dx: +1, dy: 0 },
      { dx: -2, dy: 0 },
      { dx: +1, dy: -2 },
      { dx: -2, dy: +1 },
    ]);
  });

  it('KICKS_I: 2->3 entries match the Guideline', () => {
    expect(KICKS_I['2->3']).toEqual([
      { dx: 0, dy: 0 },
      { dx: +2, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: +2, dy: +1 },
      { dx: -1, dy: -2 },
    ]);
  });

  it('KICKS_I: 3->2 entries match the Guideline', () => {
    expect(KICKS_I['3->2']).toEqual([
      { dx: 0, dy: 0 },
      { dx: -2, dy: 0 },
      { dx: +1, dy: 0 },
      { dx: -2, dy: -1 },
      { dx: +1, dy: +2 },
    ]);
  });

  it('KICKS_I: 3->0 entries match the Guideline', () => {
    expect(KICKS_I['3->0']).toEqual([
      { dx: 0, dy: 0 },
      { dx: +1, dy: 0 },
      { dx: -2, dy: 0 },
      { dx: +1, dy: -2 },
      { dx: -2, dy: +1 },
    ]);
  });

  it('KICKS_I: 0->3 entries match the Guideline', () => {
    expect(KICKS_I['0->3']).toEqual([
      { dx: 0, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: +2, dy: 0 },
      { dx: -1, dy: +2 },
      { dx: +2, dy: -1 },
    ]);
  });
});

describe('nextRotation', () => {
  it('cycles forward through 0,1,2,3,0 with dir=1', () => {
    expect(nextRotation(0, 1)).toBe(1);
    expect(nextRotation(1, 1)).toBe(2);
    expect(nextRotation(2, 1)).toBe(3);
    expect(nextRotation(3, 1)).toBe(0);
  });
  it('cycles backward through 0,3,2,1,0 with dir=-1', () => {
    expect(nextRotation(0, -1)).toBe(3);
    expect(nextRotation(3, -1)).toBe(2);
    expect(nextRotation(2, -1)).toBe(1);
    expect(nextRotation(1, -1)).toBe(0);
  });
});

describe('isPieceRotationAllowed', () => {
  it('returns false for O', () => expect(isPieceRotationAllowed('O')).toBe(false));
  it('returns true for I,J,L,S,T,Z', () => {
    for (const p of ['I', 'J', 'L', 'S', 'T', 'Z'] as const) {
      expect(isPieceRotationAllowed(p)).toBe(true);
    }
  });
});
