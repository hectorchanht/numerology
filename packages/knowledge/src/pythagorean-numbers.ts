import type { Cite, KnowledgeMeta, KnowledgeTier } from "./types.js";
import DATA from "./pythagorean-numbers.data.js";

export interface NumberQuality {
  n: number;
  keywords: Record<"zht" | "zhs" | "en", string>;
  tier: KnowledgeTier;
  cite: Cite;
}

export const PYTHAGOREAN_NUMBERS_META: KnowledgeMeta = DATA.meta;

/** 查數性質(n ∈ 1–9, 11, 22, 33);其他數返回 undefined。 */
export function numberQuality(n: number): NumberQuality | undefined {
  return (DATA.numbers as NumberQuality[]).find((x) => x.n === n);
}
