import type { CrossSignal, CrossSystemId, CrossSystemResult, Relation } from "@numerology/engine";

type Cite = CrossSignal["cite"];
type KnowledgeTier = NonNullable<CrossSignal["tier"]>;

/* ── 多體系對照卡的顯示資料(純函數,供測試) ── */

export interface CrossRow {
  system: CrossSystemId;
  value: string;
  wuxing: string;
  bridge?: "河圖";
  relation: Relation | "anchor";
  /** 對八字扶抑喜忌:八字列為錨點;中和盤一律 neutral。 */
  fit: NonNullable<CrossSignal["fit"]> | "anchor";
  tier: KnowledgeTier | "unrated";
  cite: Cite;
  steps: string[];
  /** 生命靈數用民用日期;八字、紫微、九星用真太陽時校正後日期。 */
  dateBasis: "civil" | "solar";
}

export function crossRows(r: CrossSystemResult): CrossRow[] {
  // 非八字而缺 relation → 無從比對,整列略去,不虛報「印證」。
  return r.signals.flatMap((s): CrossRow[] => {
    const relation = s.system === "bazi" ? "anchor" : s.relation;
    if (!relation) return [];
    return [{
      system: s.system,
      value: s.value,
      wuxing: s.wuxing,
      bridge: s.bridge,
      relation,
      fit: s.system === "bazi" ? "anchor" : r.fuyi.verdict === "neutral" ? "neutral" : s.fit ?? "neutral",
      tier: s.tier ?? "unrated",
      cite: s.cite,
      steps: s.steps,
      dateBasis: s.system === "lifepath" ? "civil" : "solar",
    }];
  });
}

/** 洛書(即 Saturn 方陣),上南下北。 */
export const LUOSHU = [[4, 9, 2], [3, 5, 7], [8, 1, 6]];

export type LuoshuSystem = "ninestar-year" | "ninestar-month" | "lifepath";
export interface LuoshuMark { value: number; system: LuoshuSystem; row: number; col: number }

/** 主數 11/22/33 先化簡為 2/4/6,其餘已是 1–9。 */
const toDigit = (n: number) => (n > 9 ? String(n).split("").reduce((a, d) => a + Number(d), 0) : n);

export function luoshuMarks(r: CrossSystemResult): LuoshuMark[] {
  const items: [LuoshuSystem, number][] = [
    ["ninestar-year", r.nineStar.year.number],
    ["ninestar-month", r.nineStar.month.number],
    ["lifepath", toDigit(r.lifePath.value)],
  ];
  const out: LuoshuMark[] = [];
  for (const [system, value] of items) {
    LUOSHU.forEach((row, ri) => {
      const ci = row.indexOf(value);
      if (ci >= 0) out.push({ value, system, row: ri, col: ci });
    });
  }
  return out;
}
