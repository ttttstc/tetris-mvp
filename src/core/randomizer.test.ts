/**
 * src/core/randomizer.test.ts
 *
 * Verifies 7-bag integrity, determinism with seeded RNG, and the shuffle helper.
 */

import { describe, it, expect } from 'vitest';
import { SevenBag, mulberry32, shuffle } from './randomizer';
import { ALL_PIECE_IDS } from './types';

describe('SevenBag', () => {
  it('produces all 7 distinct pieces within a single bag', () => {
    const bag = new SevenBag(mulberry32(42));
    const drawn: string[] = [];
    for (let i = 0; i < 7; i++) drawn.push(bag.next());
    expect(new Set(drawn).size).toBe(7);
    expect([...drawn].sort()).toEqual([...ALL_PIECE_IDS].sort());
  });

  it('two consecutive bags each contain all 7 pieces (no carryover)', () => {
    const bag = new SevenBag(mulberry32(42));
    const first7 = new Set(Array.from({ length: 7 }, () => bag.next()));
    const second7 = new Set(Array.from({ length: 7 }, () => bag.next()));
    expect(first7.size).toBe(7);
    expect(second7.size).toBe(7);
  });

  it('peek does not consume pieces', () => {
    const bag = new SevenBag(mulberry32(1));
    const a = bag.peek(5);
    const b = bag.peek(5);
    expect(a).toEqual(b);
  });

  it('is deterministic given the same seed', () => {
    const a = new SevenBag(mulberry32(7));
    const b = new SevenBag(mulberry32(7));
    for (let i = 0; i < 14; i++) {
      expect(a.next()).toBe(b.next());
    }
  });

  it('differs across seeds (with high probability)', () => {
    const a = new SevenBag(mulberry32(1));
    const b = new SevenBag(mulberry32(2));
    const aFirst5 = Array.from({ length: 5 }, () => a.next());
    const bFirst5 = Array.from({ length: 5 }, () => b.next());
    expect(aFirst5).not.toEqual(bFirst5);
  });

  it('reset clears state', () => {
    const bag = new SevenBag(mulberry32(3));
    bag.next();
    bag.next();
    bag.reset();
    expect(bag.peek(7)).toHaveLength(7);
  });
});

describe('mulberry32', () => {
  it('produces values in [0, 1)', () => {
    const rng = mulberry32(1);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('shuffle', () => {
  it('returns a NEW array (does not mutate input)', () => {
    const rng = mulberry32(0);
    const input = [1, 2, 3, 4];
    const out = shuffle(input, rng);
    expect(out).not.toBe(input);
    expect(input).toEqual([1, 2, 3, 4]);
  });
  it('preserves element multiset', () => {
    const rng = mulberry32(99);
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input, rng);
    expect(out.slice().sort()).toEqual(input.slice().sort());
  });
});
