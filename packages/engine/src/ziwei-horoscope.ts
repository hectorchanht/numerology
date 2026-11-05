import { astro } from "iztro";
import { Lunar, Solar } from "lunar-javascript";
import type { BirthInput } from "./types.js";
import { hourToTimeIndex, validateBirthInput } from "./time.js";
import { resolveBirthDateTime } from "./solartime.js";
import { buildStarToPalace } from "./fortune.js";

export type ZiweiLayerKey = "decadal" | "age" | "yearly" | "monthly" | "daily";
type Hua = "禄" | "权" | "科" | "忌";

/**
 * 注意 heavenlyStem / earthlyBranch 語義因層而異:
 * decadal / age 係該層【命宮所在宮】嘅干支;yearly / monthly / daily 係【該時段本身】嘅干支(流年太歲、月柱、日柱)。
 * palaceIndex / natalPalaceName 則一律係該層命宮落本命盤嘅宮位。douJun.branch 係宮支。
 */
export interface ZiweiLayer {
  key: ZiweiLayerKey;
  label: "大限" | "小限" | "流年" | "流月" | "流日";
  /** 大限未起 / 出生前 → false,其餘欄位照填但 UI 灰 */
  active: boolean;
  heavenlyStem: string;
  earthlyBranch: string;
  /** 該層命宮落本命宮 index */
  palaceIndex: number;
  natalPalaceName: string;
  /** 長度 12,index 對本命宮 index:該層十二宮名(疊宮) */
  palaceNames: string[];
  sihua: { type: Hua; star: string; intoPalace: string }[];
  /** 運限流耀(如「流禄」「运羊」) */
  stars: { name: string; natalPalaceName: string }[];
  /** 只 age 層:虛歲 */
  nominalAge?: number;
}

export interface ZiweiOverlap {
  star: string;
  natalPalaceName: string;
  layers: { layer: "生年" | "大限" | "流年" | "流月"; type: Hua }[];
  tag: string;
}

export interface ZiweiHoroscope {
  date: string;
  layers: ZiweiLayer[];
  /** 斗君 = 流年正月所在宮 */
  douJun: { branch: string; natalPalaceName: string };
  overlaps: ZiweiOverlap[];
}

const HUA: Hua[] = ["禄", "权", "科", "忌"];
const LAYERS: [ZiweiLayerKey, ZiweiLayer["label"]][] = [
  ["decadal", "大限"], ["age", "小限"], ["yearly", "流年"], ["monthly", "流月"], ["daily", "流日"],
];

/** 四化疊化:同星在 ≥ 2 層出現 → 一條。 */
export function computeOverlaps(
  layers: { layer: ZiweiOverlap["layers"][number]["layer"]; sihua: ZiweiLayer["sihua"] }[],
): ZiweiOverlap[] {
  const by = new Map<string, ZiweiOverlap>();
  for (const { layer, sihua } of layers) {
    for (const s of sihua) {
      const o = by.get(s.star) ?? { star: s.star, natalPalaceName: s.intoPalace, layers: [], tag: "" };
      o.layers.push({ layer, type: s.type });
      by.set(s.star, o);
    }
  }
  return [...by.values()]
    .filter((o) => o.layers.length >= 2)
    .map((o) => {
      const types = o.layers.map((l) => l.type);
      const uniq = [...new Set(types)];
      const tag = uniq.includes("禄") && uniq.includes("忌") ? "禄忌同星" : uniq.length === 1 ? `${uniq[0]}叠${uniq[0]}` : uniq.join("叠");
      return { ...o, tag };
    });
}

export function castZiweiHoroscope(input: BirthInput, date: string): ZiweiHoroscope {
  validateBirthInput(input);
  const t = resolveBirthDateTime(input);
  const a = astro.bySolar(`${t.year}-${t.month}-${t.day}`, hourToTimeIndex(t.hour), input.gender, true, "zh-CN");
  const h = a.horoscope(date);
  const starToPalace = buildStarToPalace(a.palaces);
  const nameOf = (i: number) => a.palaces[i]?.name ?? "未知";

  const [by, bm, bd] = [t.year, t.month, t.day];
  const [dy, dm, dd] = date.split("-").map(Number) as [number, number, number];
  const beforeBirth = new Date(dy, dm - 1, dd) < new Date(by, bm - 1, bd);
  const firstStart = Math.min(...a.palaces.map((p) => p.decadal.range[0] ?? 0));

  const layers: ZiweiLayer[] = LAYERS.map(([key, label]) => {
    const l = h[key];
    return {
      key,
      label,
      active: !beforeBirth && (key !== "decadal" || (h.age.nominalAge ?? 0) >= firstStart),
      heavenlyStem: l.heavenlyStem,
      earthlyBranch: l.earthlyBranch,
      palaceIndex: l.index,
      natalPalaceName: nameOf(l.index),
      palaceNames: [...l.palaceNames],
      sihua: l.mutagen.map((star: string, i: number) => ({
        type: HUA[i]!,
        star,
        intoPalace: starToPalace.get(star) ?? "未入盘",
      })),
      stars: (l.stars ?? []).flatMap((ss: { name: string }[], i: number) =>
        ss.map((s) => ({ name: s.name, natalPalaceName: nameOf(i) }))),
      ...(key === "age" ? { nominalAge: h.age.nominalAge } : {}),
    };
  });

  // 斗君:流年正月所在宮 → 取該農曆年正月初一(閏月不影響)的流月宮
  const newYear = Lunar.fromYmd(yearOfLunar(dy, dm, dd), 1, 1).getSolar();
  const m1 = a.horoscope(`${newYear.getYear()}-${newYear.getMonth()}-${newYear.getDay()}`).monthly;
  const douJun = { branch: a.palaces[m1.index]?.earthlyBranch ?? "", natalPalaceName: nameOf(m1.index) };

  // 生年四化取本命星 mutagen
  const natal: ZiweiLayer["sihua"] = [];
  for (const p of a.palaces) {
    for (const s of [...p.majorStars, ...p.minorStars]) {
      const i = s.mutagen ? HUA.indexOf(s.mutagen as Hua) : -1;
      if (i >= 0) natal.push({ type: HUA[i]!, star: s.name, intoPalace: p.name });
    }
  }
  const overlaps = computeOverlaps(([
    { layer: "生年", sihua: natal },
    // 未起嘅大限(active:false)唔入疊化
    ...(["decadal:大限", "yearly:流年", "monthly:流月"] as const).map((k) => {
      const [key, layer] = k.split(":") as [ZiweiLayerKey, "大限" | "流年" | "流月"];
      return { layer, sihua: layers.find((l) => l.key === key)!.sihua };
    }),
  ] as Parameters<typeof computeOverlaps>[0]).filter((x) => x.layer === "生年" || layers.find((l) => l.label === x.layer)!.active));

  return { date, layers, douJun, overlaps };
}

/** 公曆日 → 所屬農曆年(閏月 / 正月前後皆正確)。 */
function yearOfLunar(y: number, m: number, d: number): number {
  return Solar.fromYmd(y, m, d).getLunar().getYear();
}
