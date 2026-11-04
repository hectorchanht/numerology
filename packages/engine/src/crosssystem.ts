import type { Cite, KnowledgeTier } from "@numerology/knowledge";
import type { ChartResult } from "./types.js";
import type { Wuxing5 } from "./wuge.js";
import { WUXING } from "./shishen.js";
import { castNineStar, type NineStarResult } from "./ninestar.js";
import { lifePath, hetuWuxing, type LifePathResult } from "./lifepath.js";
import { castKamea, type KameaResult } from "./kamea.js";
import { castFuyi, type FuyiResult } from "./fuyi.js";

export type Relation = "same" | "sheng" | "ke";
export type CrossSystemId = "bazi" | "ziwei" | "ninestar" | "lifepath";

export interface CrossSignal {
  system: CrossSystemId;
  value: string;
  wuxing: Wuxing5;
  bridge?: "河圖";
  tier?: KnowledgeTier;
  cite: Cite;
  steps: string[];
  relation?: Relation;
  /** 相對八字扶抑喜忌;錨點 bazi 無 */
  fit?: "favorable" | "unfavorable" | "neutral";
}

export interface CrossSystemResult {
  anchor: Wuxing5;
  signals: CrossSignal[];
  distribution: Record<Wuxing5, number>;
  nineStar: NineStarResult;
  lifePath: LifePathResult;
  kamea: KameaResult;
  fuyi: FuyiResult;
}

const ORDER: Wuxing5[] = ["木", "火", "土", "金", "水"];

/** 雙向:相鄰(a 生 b 或 b 生 a)為 sheng,隔一位為 ke。 */
export function wuxingRelation(a: Wuxing5, b: Wuxing5): Relation {
  const d = (ORDER.indexOf(a) - ORDER.indexOf(b) + 5) % 5;
  return d === 0 ? "same" : d === 1 || d === 4 ? "sheng" : "ke";
}

const REL_ZH: Record<Relation, string> = { same: "同", sheng: "相生", ke: "相克" };
const FIT_ZH = { favorable: "屬喜用", unfavorable: "屬忌", neutral: "屬閒" } as const;

export function castCrossSystem(chart: ChartResult): CrossSystemResult {
  const { year, month, day } = chart.input;
  const dm = chart.bazi.dayMaster;
  const anchor = WUXING[dm];
  const ns = castNineStar(chart.input);
  const lp = lifePath(year, month, day);
  const kamea = castKamea(year, month, day, [
    { value: lp.value, system: "lifepath" },
    { value: ns.year.number, system: "ninestar" },
  ]);

  const signals: CrossSignal[] = [{
    system: "bazi", value: dm, wuxing: anchor, tier: "classical",
    cite: { work: "淵海子平" },
    steps: [`日主 ${dm} → 五行 ${anchor}`, "以日主五行為錨點,其餘體系與之比對"],
  }];

  const fec = chart.ziwei.fiveElementsClass;
  const zw = fec?.[0] as Wuxing5 | undefined;
  if (zw && ORDER.includes(zw)) {
    signals.push({
      system: "ziwei", value: fec, wuxing: zw, tier: "classical",
      cite: { work: "紫微斗數全書" },
      steps: [`五行局 ${fec} → 五行 ${zw}`],
    });
  }

  signals.push({
    system: "ninestar", value: ns.year.name, wuxing: ns.year.wuxing, tier: "classical",
    cite: { work: "玄空九星(年月紫白)" },
    steps: [`年星 ${ns.year.name} → 五行 ${ns.year.wuxing}`, ...ns.steps],
  });

  const lpw = hetuWuxing(lp.value);
  const agree = lp.methodsAgree;
  signals.push({
    system: "lifepath",
    value: agree ? String(lp.byComponents) : `${lp.byComponents}(全數字法 ${lp.byDigits})`,
    wuxing: lpw, bridge: "河圖", tier: "modern",
    cite: { work: "Modern Pythagorean numerology", locator: "L. Dow Balliett (1908)" },
    steps: [
      ...lp.steps.components,
      ...(agree ? [] : [...lp.steps.digits, `算法分歧:分項法 ${lp.byComponents},全數字法 ${lp.byDigits},經河圖橋接時以分項法為準`]),
      `生命靈數 ${lp.value} 經河圖橋接 → 五行 ${lpw}`,
    ],
  });

  const fuyi = castFuyi(chart);
  for (const s of signals) {
    if (s.system === "bazi") continue;
    s.relation = wuxingRelation(anchor, s.wuxing);
    s.steps.push(`與日主五行 ${anchor} 比對:${REL_ZH[s.relation]}`);
    s.fit = fuyi.favorable.includes(s.wuxing) ? "favorable"
      : fuyi.unfavorable.includes(s.wuxing) ? "unfavorable" : "neutral";
    s.steps.push(fuyi.verdict === "neutral"
      ? "對八字扶抑喜忌:八字中和,不定喜忌 → 閒"
      : `對八字扶抑喜忌:五行 ${s.wuxing} ${FIT_ZH[s.fit]}(喜用 ${fuyi.favorable.join("、")};忌 ${fuyi.unfavorable.join("、")});`
        + `基率:隨機落喜用約 ${fuyi.favorable.length}/5、忌約 ${fuyi.unfavorable.length}/5`);
  }

  const distribution = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 } as Record<Wuxing5, number>;
  for (const s of signals) distribution[s.wuxing]++;
  return { anchor, signals, distribution, nineStar: ns, lifePath: lp, kamea, fuyi };
}
