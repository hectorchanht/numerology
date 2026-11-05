import type { Tiangan, Dizhi } from "@numerology/knowledge";
import { shiShen, dizhiHideGan } from "./shishen.js";
import { LUSHEN, YANGREN } from "./shensha.js";

/** 格局結果(《子平真詮》月令取格,簡化)。 */
export interface GejuResult {
  main: string;
  also: string[];
  basis: "本气透" | "中气透" | "余气透" | "本气未透" | "禄刃";
  steps: string[];
  tier: "modern";
  note: string;
  cite: string;
  /** 由 castChart 經 castFuyi 填入;true 時 steps 尾加外格提示 */
  possibleCong: boolean;
}

const YANG = "甲丙戊庚壬";
const LAYER = ["本气透", "中气透", "余气透"] as const;

/** 月令取格:月支為日主祿位 → 建祿;陽干月支為羊刃 → 陽刃;陰干本氣為劫財 → 月劫;否則取月支藏干中透出天干者。 */
export function castGeju(
  dayMaster: Tiangan,
  monthZhi: Dizhi,
  stems: { pos: "year" | "month" | "hour"; gan: string }[],
): Omit<GejuResult, "possibleCong"> {
  const hide = dizhiHideGan(monthZhi);
  const mainSs = shiShen(dayMaster, hide[0]!);
  const base = {
    tier: "modern" as const,
    note: "本站按《子平真詮》月令取格簡化,不含成敗救應",
    cite: "《子平真詮》論用神、論建祿月劫:https://ctext.org/wiki.pl?if=gb&res=631975",
  };
  // 《論建祿月劫》:按祿/刃位判,唔係睇本氣十神(戊辰本氣戊雖係比肩,辰非戊祿,唔入建祿)。
  const lu = LUSHEN[dayMaster]?.includes(monthZhi);
  const ren = YANG.includes(dayMaster) && YANGREN[dayMaster]?.includes(monthZhi);
  if (lu || ren || (!YANG.includes(dayMaster) && mainSs === "劫财")) {
    const main = lu ? "建禄格" : ren ? "阳刃格" : "月劫格";
    return { main, also: [], basis: "禄刃", steps: [`月支 ${monthZhi} 對日主 ${dayMaster}${lu ? "為禄位" : ren ? "為羊刃位" : "本气 " + hide[0] + " 為劫财"} → ${main}`], ...base };
  }
  const shown = new Set(stems.map((s) => s.gan));
  const hits: { ss: string; layer: (typeof LAYER)[number]; gan: string }[] = [];
  hide.forEach((gan, i) => {
    const ss = shiShen(dayMaster, gan);
    if (ss === "比肩" || ss === "劫财") return; // 比劫不取格
    if (shown.has(gan)) hits.push({ ss, layer: LAYER[i]!, gan });
  });
  if (!hits.length) {
    // 本氣為比劫而非祿刃位:比劫不取格,改取首個非比劫藏干(本气未透)
    const gan = hide.find((g) => { const x = shiShen(dayMaster, g); return x !== "比肩" && x !== "劫财"; })!;
    const ss = shiShen(dayMaster, gan);
    return { main: ss + "格", also: [], basis: "本气未透", steps: [`月支 ${monthZhi} 藏干 ${hide.join("")} 皆未透干 → 取${gan}為${ss}格`], ...base };
  }
  const [first, ...rest] = hits;
  return {
    main: first!.ss + "格",
    also: rest.map((h) => h.ss + "格"),
    basis: first!.layer,
    steps: [`月支 ${monthZhi} 藏干 ${hide.join("")},${first!.gan} 透干 → ${first!.ss}格(${first!.layer})`],
    ...base,
  };
}
