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
