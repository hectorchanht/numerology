import { ZIWEI_GEJU, type ZiweiGejuCond, type ZiweiGejuRule } from "@numerology/knowledge";
import { DIZHI } from "@numerology/knowledge";
import type { ZiweiPalace, ZiweiStar } from "./types.js";

const RING = DIZHI as readonly string[];

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
  const bright = (s: ZiweiStar, br?: string[]) => !br || (s.brightness !== undefined && br.includes(s.brightness));
  // stars 每顆都要喺 pool;mutagens 每個四化都要有星帶住;br 限兩者亮度
  const found = (pool: ZiweiStar[], stars: string[], br?: string[], muts?: string[]) =>
    stars.every((n) => pool.some((s) => s.name === n && bright(s, br))) &&
    (muts ?? []).every((m) => pool.some((s) => s.mutagen === m && bright(s, br)));
  const tag = (c: { brightness?: string[]; mutagens?: string[] }) =>
    (c.mutagens ? `(见化${c.mutagens.join("、化")})` : "") + (c.brightness ? `(亮度限${c.brightness.join("/")})` : "");

  switch (c.op) {
    case "samePalace": {
      const p = palaces.find((x) => (!c.branches || c.branches.includes(x.earthlyBranch)) && found(allStars(x), c.stars, c.brightness));
      return p ? `${c.stars.join("、")}同在 ${p.name}(${p.earthlyBranch} 宫)${tag(c)}` : null;
    }
    case "inSanFang": {
      const { self, opposite, trine } = soul.sanFang.branches;
      const br = [self, opposite, ...trine];
      const pool = palaces.filter((x) => br.includes(x.earthlyBranch)).flatMap(allStars);
      return found(pool, c.stars, c.brightness, c.mutagens) ? `${c.stars.join("、") || "四化"}皆在命宫三方四正(${br.join("")})${tag(c)}` : null;
    }
    case "inPalace":
      if (c.branches && !c.branches.includes(soul.earthlyBranch)) return null;
      if (!found(allStars(soul), c.stars, c.brightness, c.mutagens)) return null;
      return c.stars.length
        ? `${c.stars.join("、")}同在命宫(${soul.earthlyBranch})${tag(c)}`
        : `命宫在 ${soul.earthlyBranch}${tag(c)}`;
    case "flank": {
      const i = RING.indexOf(soul.earthlyBranch);
      const [l, r] = [RING[(i + 11) % 12], RING[(i + 1) % 12]].map((b) => allStars(palaces.find((x) => x.earthlyBranch === b)!));
      const [a, b] = c.stars;
      const ok = (found(l!, [a]) && found(r!, [b])) || (found(l!, [b]) && found(r!, [a]));
      return ok ? `${a}、${b}夹命宫(${RING[(i + 11) % 12]}${RING[(i + 1) % 12]})` : null;
    }
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
    if (r.any) steps.push(r.any.map((c) => evalCond(c, palaces, soul)).find((s) => s !== null) ?? null);
    if (steps.every((s): s is string => s !== null)) {
      hits.push({ id: r.id, name: r.name, verdict: r.verdict, cite: r.cite, steps });
    }
  }
  return hits;
}
