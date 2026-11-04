import type { Cite } from "@numerology/knowledge";
import type { ChartResult } from "./types.js";
import type { Wuxing5 } from "./wuge.js";
import { WUXING, dizhiHideGan } from "./shishen.js";

/** 扶抑喜忌結果。評分權重為本站規則(tier modern)。 */
export interface FuyiResult {
  score: number;
  verdict: "strong" | "weak" | "neutral";
  favorable: Wuxing5[];
  unfavorable: Wuxing5[];
  possibleCong: boolean;
  steps: string[];
  tier: "modern";
  cite: Cite;
}

type Group = "比劫" | "印" | "食傷" | "財" | "官殺";

const ORDER: Wuxing5[] = ["木", "火", "土", "金", "水"];
/** 藏干權重:本氣、中氣、餘氣 */
const HIDE_W = [1, 0.5, 0.3];
const HIDE_NAME = ["本氣", "中氣", "餘氣"];

/** 以日主五行 x 為基準,五行 e 屬哪一類。 */
function groupOf(x: Wuxing5, e: Wuxing5): Group {
  const d = (ORDER.indexOf(e) - ORDER.indexOf(x) + 5) % 5;
  return (["比劫", "食傷", "財", "官殺", "印"] as const)[d]!;
}

function elementOf(x: Wuxing5, g: Group): Wuxing5 {
  const d = { 比劫: 0, 食傷: 1, 財: 2, 官殺: 3, 印: 4 }[g];
  return ORDER[(ORDER.indexOf(x) + d) % 5]!;
}

const helps = (g: Group) => g === "比劫" || g === "印";
const fmt = (n: number) => String(Math.round(n * 10) / 10);
const signed = (n: number) => (n >= 0 ? `+${fmt(n)}` : `−${fmt(-n)}`);

export function castFuyi(chart: ChartResult): FuyiResult {
  const p = chart.bazi.fourPillars;
  const x = WUXING[chart.bazi.dayMaster as keyof typeof WUXING] as Wuxing5;
  const steps: string[] = [`日主 ${chart.bazi.dayMaster} → 五行 ${x};同我、生我(比劫、印)為扶,剋洩耗(官殺、食傷、財)為抑`];

  // 得令:月支本氣
  const monthMain = dizhiHideGan(p.month.zhi)[0]!;
  const mw = WUXING[monthMain] as Wuxing5;
  const mg = groupOf(x, mw);
  const deling = helps(mg) ? 3 : -3;
  steps.push(`得令:月支 ${p.month.zhi} 本氣 ${monthMain}(${mw})屬${mg} → ${signed(deling)}`);

  // 得地:四柱藏干,月支本氣已計入得令
  let dedi = 0;
  const parts: string[] = [];
  for (const [label, pl] of [["年", p.year], ["月", p.month], ["日", p.day], ["時", p.hour]] as const) {
    dizhiHideGan(pl.zhi).forEach((g, i) => {
      if (label === "月" && i === 0) return;
      const w = WUXING[g] as Wuxing5;
      const v = (helps(groupOf(x, w)) ? 1 : -1) * HIDE_W[i]!;
      dedi += v;
      parts.push(`${label}支${pl.zhi}${HIDE_NAME[i]}${g}(${groupOf(x, w)})${signed(v)}`);
    });
  }
  dedi = Math.round(dedi * 10) / 10;
  steps.push(`得地:${parts.join("、")} → 合計 ${signed(dedi)}`);

  // 得勢:年、月、時天干
  let deshi = 0;
  const gparts: string[] = [];
  for (const [label, pl] of [["年", p.year], ["月", p.month], ["時", p.hour]] as const) {
    const w = WUXING[pl.gan as keyof typeof WUXING] as Wuxing5;
    const v = helps(groupOf(x, w)) ? 1 : -1;
    deshi += v;
    gparts.push(`${label}干${pl.gan}(${groupOf(x, w)})${signed(v)}`);
  }
  steps.push(`得勢:${gparts.join("、")} → 合計 ${signed(deshi)}`);

  const score = Math.round((deling + dedi + deshi) * 10) / 10;
  const verdict = score > 1.5 ? "strong" : score < -1.5 ? "weak" : "neutral";
  steps.push(`總分 ${signed(deling)} ${signed(dedi)} ${signed(deshi)} = ${signed(score)};> +1.5 身強,< −1.5 身弱,其間中和`);

  let favorable: Wuxing5[] = [];
  let unfavorable: Wuxing5[] = [];
  if (verdict === "weak") {
    favorable = (["印", "比劫"] as Group[]).map((g) => elementOf(x, g));
    unfavorable = (["官殺", "食傷", "財"] as Group[]).map((g) => elementOf(x, g));
    steps.push(`身弱 → 喜用 印、比劫(${favorable.join("、")});忌 官殺、食傷、財(${unfavorable.join("、")})`);
  } else if (verdict === "strong") {
    favorable = (["食傷", "財", "官殺"] as Group[]).map((g) => elementOf(x, g));
    unfavorable = (["印", "比劫"] as Group[]).map((g) => elementOf(x, g));
    steps.push(`身強 → 喜用 食傷、財、官殺(${favorable.join("、")});忌 印、比劫(${unfavorable.join("、")})`);
  } else {
    steps.push("中和,以調候為參,不定扶抑喜忌");
  }
  const possibleCong = score <= -6 || score >= 6;
  if (possibleCong) steps.push("總分達 ±6,可能從格,扶抑結論僅供參考");
  steps.push("本站簡化評分,非古籍原文");

  return {
    score, verdict, favorable, unfavorable, possibleCong, steps,
    tier: "modern", cite: { work: "子平真詮", locator: "扶抑論;評分權重為本站規則" },
  };
}
