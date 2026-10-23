import type { BaziChart, DaYunStep } from "@numerology/engine";

/**
 * 純展示用的干支小工具(無 I/O,可測試):流年干支、五行計數、當前大運。
 * 只做查表,不改動引擎排盤結果。
 */

const GAN = "甲乙丙丁戊己庚辛壬癸";
const ZHI = "子丑寅卯辰巳午未申酉戌亥";

export const WUXING = ["木", "火", "土", "金", "水"] as const;
export type WuXing = (typeof WUXING)[number];

const GAN_WX: Record<string, WuXing> = {
  甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土", 己: "土", 庚: "金", 辛: "金", 壬: "水", 癸: "水",
};
const ZHI_WX: Record<string, WuXing> = {
  子: "水", 丑: "土", 寅: "木", 卯: "木", 辰: "土", 巳: "火", 午: "火", 未: "土", 申: "金", 酉: "金", 戌: "土", 亥: "水",
};

/** 公曆年 → 該年干支(以年份標示,如 2026 → 丙午)。 */
export function yearGanZhi(year: number): string {
  const i = (((year - 4) % 60) + 60) % 60;
  return GAN[i % 10]! + ZHI[i % 12]!;
}

/** 四柱八字(4 干 + 4 支)的五行個數。 */
export function wuxingCount(pillars: { gan: string; zhi: string }[]): Record<WuXing, number> {
  const out: Record<WuXing, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  for (const p of pillars) {
    const g = GAN_WX[p.gan];
    const z = ZHI_WX[p.zhi];
    if (g) out[g] += 1;
    if (z) out[z] += 1;
  }
  return out;
}

/** 四柱藏干(引擎已排好的 pillar.hideGan)的五行個數。 */
export function wuxingHiddenCount(pillars: { hideGan: string[] }[]): Record<WuXing, number> {
  const out: Record<WuXing, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  for (const p of pillars) for (const g of p.hideGan) {
    const w = GAN_WX[g];
    if (w) out[w] += 1;
  }
  return out;
}

/** 天干 → 五行(非天干回 undefined)。 */
export function ganWuXing(gan: string): WuXing | undefined {
  return GAN_WX[gan];
}

/**
 * 十二地支藏干(本氣在前)。與引擎 dizhiHideGan 同一張標準表——
 * 前端唔直接 import 引擎 runtime(會將 iztro 打包入主頁),
 * 由 test/ganzhi.test.mjs 逐支對拍引擎,防止兩邊漂移。
 */
export const HIDE_GAN: Record<string, readonly string[]> = {
  子: ["癸"], 丑: ["己", "癸", "辛"], 寅: ["甲", "丙", "戊"], 卯: ["乙"],
  辰: ["戊", "乙", "癸"], 巳: ["丙", "庚", "戊"], 午: ["丁", "己"], 未: ["己", "丁", "乙"],
  申: ["庚", "壬", "戊"], 酉: ["辛"], 戌: ["戊", "辛", "丁"], 亥: ["壬", "甲"],
};

/** 調候用神引動度:2 = 天干透出用神;1 = 只係地支藏干有用神;0 = 未引動。 */
export type UseGodSignal = 0 | 1 | 2;

/**
 * 某干支(大運/流年)對調候用神的引動度。
 * 同引擎 analyzeFortune 的 suppliesUseGod 同一條規則(天干或藏干命中用神 = 補益),
 * 只係再分「天干透出」同「藏干暗藏」兩級——唔加任何新嘅吉凶推算。
 */
export function useGodSignal(ganZhi: string, useGods: readonly string[]): UseGodSignal {
  const gan = ganZhi[0] ?? "";
  const zhi = ganZhi[1] ?? "";
  if (useGods.includes(gan)) return 2;
  if ((HIDE_GAN[zhi] ?? []).some((g) => useGods.includes(g))) return 1;
  return 0;
}

/** 有干支的大運步(去掉起運前那一段空干支)。 */
export function luckSteps(bazi: Pick<BaziChart, "daYun">): DaYunStep[] {
  return bazi.daYun.filter((d) => d.ganZhi);
}

/** 某大運覆蓋的公曆年份(起運年起共 endAge-startAge+1 年)。 */
export function stepYears(d: DaYunStep): number[] {
  const n = Math.max(1, d.endAge - d.startAge + 1);
  return Array.from({ length: n }, (_, i) => d.startYear + i);
}

/** 指定年份所在的大運(默認今年);不在任何一步則 undefined。 */
export function currentLuckStep(bazi: Pick<BaziChart, "daYun">, year = new Date().getFullYear()): DaYunStep | undefined {
  return luckSteps(bazi).find((d) => year >= d.startYear && year <= d.startYear + d.endAge - d.startAge);
}
