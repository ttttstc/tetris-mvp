// Deterministic seeded RNG (Mulberry32)
// 用法：注入到 SevenBag，确保 randomizer.ts 单测可重放 + 与未来 Replay 兼容。
// ponrail: 不引依赖、不造工厂；32-bit 整数足够 7-bag 单元测需要。
export function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
