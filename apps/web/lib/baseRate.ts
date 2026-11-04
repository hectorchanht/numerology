/**
 * 基率模擬器(學院科學專區):k 個互相獨立的體系,各自隨機落在 m 類之一,
 * 問「恰好 j 個體系與錨點同類」的機率。純函數,同一輸入同一輸出。
 */

/** 至少一個體系與錨點相同:1 − (1 − 1/m)^k。 */
export function atLeastOneProb(k: number, m: number): number {
  return 1 - (1 - 1 / m) ** k;
}

function choose(n: number, r: number): number {
  let c = 1;
  for (let i = 1; i <= r; i++) c = (c * (n - r + i)) / i;
  return c;
}

/** 二項分佈 B(k, 1/m):index j = 恰好 j 個相同的機率(j = 0..k)。 */
export function binomialDist(k: number, m: number): number[] {
  const p = 1 / m;
  return Array.from({ length: k + 1 }, (_, j) => choose(k, j) * p ** j * (1 - p) ** (k - j));
}

/** mulberry32:32 位元種子的小型偽亂數,回傳 [0, 1)。 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 模擬 n 次:每次錨點與 k 個體系各抽一類,統計同類個數;回傳各 j 的比例。 */
export function simulate(k: number, m: number, n: number, seed: number): number[] {
  const rand = mulberry32(seed);
  const pick = () => Math.floor(rand() * m);
  const counts = new Array<number>(k + 1).fill(0);
  for (let i = 0; i < n; i++) {
    const anchor = pick();
    let same = 0;
    for (let s = 0; s < k; s++) if (pick() === anchor) same++;
    counts[same]!++;
  }
  return counts.map((c) => c / n);
}
