import { ZIWEI_GEJU, type ZiweiGejuCond, type ZiweiGejuRule } from "@numerology/knowledge";
import type { ZiweiPalace, ZiweiStar } from "./types.js";

export interface ZiweiGejuHit {
  id: string;
  name: string;
  verdict: "吉" | "凶" | "中";
  cite: string;
  /** 逐條命中證據 */
  steps: string[];
}

const allStars = (p: ZiweiPalace): ZiweiStar[] => [...p.majorStars, ...p.minorStars, ...p.adjectiveStars];

/** 判一條 cond;命中返回證據句,唔中返回 null */
function evalCond(c: ZiweiGejuCond, palaces: ZiweiPalace[], soul: ZiweiPalace): string | null {
  // 每顆 stars 都要喺 pool 搵到,且(如有 brightness)亮度屬限定集合
  const found = (pool: ZiweiStar[], stars: string[], br?: string[]) =>
    stars.every((n) => pool.some((s) => s.name === n && (!br || (s.brightness !== undefined && br.includes(s.brightness)))));
  const tag = (c: { brightness?: string[] }) => (c.brightness ? `(亮度限${c.brightness.join("/")})` : "");

  switch (c.op) {
    case "samePalace": {
      const p = palaces.find((x) => (!c.branches || c.branches.includes(x.earthlyBranch)) && found(allStars(x), c.stars, c.brightness));
      return p ? `${c.stars.join("、")}同在 ${p.earthlyBranch} 宫${tag(c)}` : null;
    }
    case "inSanFang": {
      const { self, opposite, trine } = soul.sanFang.branches;
      const br = [self, opposite, ...trine];
      const pool = palaces.filter((x) => br.includes(x.earthlyBranch)).flatMap(allStars);
      return found(pool, c.stars, c.brightness) ? `${c.stars.join("、")}皆在命宫三方四正(${br.join("")})${tag(c)}` : null;
    }
    case "inPalace":
      if (c.branches && !c.branches.includes(soul.earthlyBranch)) return null;
      if (!found(allStars(soul), c.stars, c.brightness)) return null;
      return c.stars.length
        ? `${c.stars.join("、")}同在命宫(${soul.earthlyBranch})${tag(c)}`
        : `命宫在 ${soul.earthlyBranch}`;
    case "noMajor":
      return soul.majorStars.length === 0 ? "命宫无主星" : null;
  }
}

/** 紫微全書格局識別:規則 `all` 全部成立先成格。 */
export function detectZiweiGeju(
  palaces: ZiweiPalace[],
  soulBranch: string,
  rules: ZiweiGejuRule[] = ZIWEI_GEJU,
): ZiweiGejuHit[] {
  const soul = palaces.find((p) => p.earthlyBranch === soulBranch);
  if (!soul) return [];
  const hits: ZiweiGejuHit[] = [];
  for (const r of rules) {
    const steps = r.all.map((c) => evalCond(c, palaces, soul));
    if (steps.every((s): s is string => s !== null)) {
      hits.push({ id: r.id, name: r.name, verdict: r.verdict, cite: r.cite, steps });
    }
  }
  return hits;
}
