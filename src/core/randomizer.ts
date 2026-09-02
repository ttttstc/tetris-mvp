/**
 * core/randomizer.ts
 *
 * 7-bag randomizer — the modern Tetris Guideline standard.
 *
 * Every "bag" contains all 7 pieces exactly once, in random order. Once a bag is
 * exhausted, a fresh bag is shuffled. This guarantees the worst-case gap
 * between any two pieces of the same type is 12 pieces (e.g. you can never go
 * 6 bags without seeing an I-piece).
 *
 * The shuffler is injected via the constructor. Tests use a seeded PRNG for
 * determinism; production uses Math.random. Replay support (future) only needs
 * to record the seed.
 */

import { ALL_PIECE_IDS, type PieceId } from './types';

/** A deterministic, side-effect-free random source: returns [0, 1). */
export type Rng = () => number;

/** Mulberry32 — a tiny, well-distributed seeded PRNG. Used for deterministic tests. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates shuffle using the provided RNG. Returns a NEW array. */
export function shuffle<T>(arr: readonly T[], rng: Rng): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const ai = a[i] as T;
    const aj = a[j] as T;
    a[i] = aj;
    a[j] = ai;
  }
  return a;
}

export class SevenBag {
  private bag: PieceId[] = [];
  private readonly rng: Rng;

  constructor(rng: Rng = Math.random) {
    this.rng = rng;
  }

  /** Peek at the next `count` upcoming pieces without consuming them. */
  peek(count: number): readonly PieceId[] {
    while (this.bag.length < count) {
      this.bag = this.bag.concat(shuffle(ALL_PIECE_IDS, this.rng));
    }
    return this.bag.slice(0, count);
  }

  /** Pop the next piece off the bag. Refills the bag when empty. */
  next(): PieceId {
    if (this.bag.length === 0) this.bag = shuffle(ALL_PIECE_IDS, this.rng);
    const head = this.bag.shift()!;
    return head;
  }

  /** Take a snapshot of the upcoming pieces (typically the next 5 for the preview UI). */
  snapshotQueue(count: number): readonly PieceId[] {
    return this.peek(count);
  }

  /** Reset state — used by restart actions and tests. */
  reset(): void {
    this.bag = [];
  }
}
