import type { ChartResult } from "@numerology/engine";
import { WUXING, wuxingCount, wuxingHiddenCount, currentLuckStep } from "./ganzhi.js";

/**
 * 報告各節嘅「命盤依據」:全部由引擎已排好嘅數據直接取,唔經 AI(可測試、零 I/O)。
 * 對應關係跟 packages/ai/src/prompts.ts REPORT_SECTIONS 嘅 brief——AI 寫嗰節時睇嘅正正係呢啲。
 * 輸出係原始中文(引擎用簡體);顯示時由呼叫方做 i18n 同繁簡轉換。
 */

export type BasisLabel =
  | { kind: "dayMaster" }
  | { kind: "palace"; palace: string }
  | { kind: "tenGod"; gods: string }
  | { kind: "dayBranch" }
  | { kind: "wuxing" }
  | { kind: "luck" }
  | { kind: "useGod" };

export interface BasisFact {
  label: BasisLabel;
  /** 事實值;空串 = 命盤冇呢樣(例如宮內無主星、四柱無財星)。 */
  value: string;
  /** 該事實嘅古籍出處(只喺知識庫真係有出處時先填)。 */
  source?: string;
  /** 十神命中位置(官殺 / 財星用)。 */
  hits?: TenGodHit[];
  /** 五行 / 大運等要按語言組句嘅原始參數。 */
  vars?: Record<string, string | number>;
}

const PILLARS = ["year", "month", "day", "hour"] as const;
export type PillarKey = (typeof PILLARS)[number];

/** 十神喺四柱嘅位置:天干(日柱除外)+ 地支藏干。 */
export interface TenGodHit {
  pillar: PillarKey;
  part: "gan" | "zhi";
  god: string;
}

export function tenGodHits(chart: ChartResult, gods: readonly string[]): TenGodHit[] {
  const out: TenGodHit[] = [];
  for (const k of PILLARS) {
    const p = chart.bazi.fourPillars[k];
    if (gods.includes(p.shiShenGan)) out.push({ pillar: k, part: "gan", god: p.shiShenGan });
    for (const g of p.shiShenZhi) if (gods.includes(g)) out.push({ pillar: k, part: "zhi", god: g });
  }
  return out;
}

/** 引擎宮名係簡體(官禄 / 财帛…),兩種寫法都認。 */
function palaceStars(chart: ChartResult, names: readonly string[]): string {
  const p = chart.ziwei.palaces.find((x) => names.includes(x.name));
  return p ? p.majorStars.map((s) => s.name).join("、") : "";
}

const OFFICER = ["正官", "七杀", "七殺"];
const WEALTH = ["正财", "偏财", "正財", "偏財"];

/** 每節嘅依據;未列出嘅節(例如 advice 以外嘅自訂節)冇依據行。 */
export function sectionBasis(chart: ChartResult, year = new Date().getFullYear()): Record<string, BasisFact[]> {
  const { bazi } = chart;
  const ps = PILLARS.map((k) => bazi.fourPillars[k]);
  const vis = wuxingCount(ps);
  const hid = wuxingHiddenCount(ps);
  const top = Math.max(...WUXING.map((k) => vis[k]));
  const strongest = WUXING.filter((k) => vis[k] === top).join("");
  const missing = WUXING.filter((k) => vis[k] + hid[k] === 0).join("");
  const luck = currentLuckStep(bazi, year);
  const godFact = (gods: string, list: readonly string[]): BasisFact => {
    const hits = tenGodHits(chart, list);
    return { label: { kind: "tenGod", gods }, value: hits.map((h) => h.god).join("、"), hits };
  };

  const soul = chart.ziwei.palaces.find((p) => p.isSoulPalace);
  const dayMaster: BasisFact = { label: { kind: "dayMaster" }, value: `${bazi.dayMaster}`, vars: { month: bazi.monthBranch } };
  const useGod: BasisFact = {
    label: { kind: "useGod" },
    value: bazi.tiaohou.useGods.join("、"),
    ...(bazi.tiaohou.reviewed ? { source: "窮通寶鑑" } : {}),
  };

  return {
    personality: [
      dayMaster,
      { label: { kind: "palace", palace: "命" }, value: soul ? soul.majorStars.map((s) => s.name).join("、") : "" },
    ],
    career: [
      { label: { kind: "palace", palace: "官禄" }, value: palaceStars(chart, ["官禄", "官祿"]) },
      godFact("官杀", OFFICER),
    ],
    wealth: [
      { label: { kind: "palace", palace: "财帛" }, value: palaceStars(chart, ["财帛", "財帛"]) },
      godFact("财星", WEALTH),
    ],
    relationship: [
      { label: { kind: "palace", palace: "夫妻" }, value: palaceStars(chart, ["夫妻"]) },
      { label: { kind: "dayBranch" }, value: bazi.fourPillars.day.zhi },
    ],
    health: [
      { label: { kind: "palace", palace: "疾厄" }, value: palaceStars(chart, ["疾厄"]) },
      { label: { kind: "wuxing" }, value: strongest, vars: { strong: strongest, missing } },
    ],
    luck: [
      {
        label: { kind: "luck" },
        value: luck ? luck.ganZhi : "",
        ...(luck ? { vars: { a: luck.startAge, b: luck.endAge } } : {}),
      },
    ],
    advice: [useGod, dayMaster],
  };
}
