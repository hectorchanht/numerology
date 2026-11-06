import { Solar } from "lunar-javascript";
import { astro } from "iztro";
import { isTiangan, type Tiangan } from "@numerology/knowledge";
import type { BirthInput } from "./types.js";
import { castBazi } from "./bazi.js";
import { hourToTimeIndex, validateBirthInput } from "./time.js";
import { dizhiHideGan, shiShen, type ShiShen } from "./shishen.js";
import { resolveBirthDateTime } from "./solartime.js";
import { externalRelations, suiYunBingLin, tianKeDiChong, type GanzhiRelation, type PillarKey } from "./relations.js";

export interface DaYunAnalysis {
  ganZhi: string;
  gan: string;
  zhi: string;
  startAge: number;
  endAge: number;
  startYear: number;
  endYear: number;
  /** 大運天干十神(相對日主) */
  ganShiShen: ShiShen;
  /** 大運地支藏干及其十神 */
  hideShiShen: { gan: string; shiShen: ShiShen }[];
  /** 是否引動調候/喜用神(天干或藏干命中用神)→ 補救信號 */
  suppliesUseGod: boolean;
  /** referenceYear 是否落在此運 */
  isCurrent: boolean;
  /**
   * 與該大運同期的大限(按大運起始年取 horoscope 判定,四化飛入本命宮)。
   * 八字大運與紫微大限的十年區間不對齊,故逐運單獨判定,避免模型把
   * "當前大限"套用到每一步大運上。
   */
  ziweiDecadal: ZiweiScopeFortune;
  /** 大運對原局的干支關係 */
  relations: GanzhiRelation[];
  tianKeDiChong: PillarKey[];
}

export interface LiuNianAnalysis {
  year: number;
  age: number;
  ganZhi: string;
  ganShiShen: ShiShen;
  suppliesUseGod: boolean;
  isReference: boolean;
  /** 該流年是否已過(早於參考年)→ 供"回看驗證" */
  isPast: boolean;
  /** 流年對原局的干支關係 */
  relations: GanzhiRelation[];
  tianKeDiChong: PillarKey[];
  /** 歲運並臨:流年干支 === 所屬大運干支 */
  suiYunBingLin: boolean;
}

export interface LiuYueAnalysis {
  index: number;
  monthName: string;
  ganZhi: string;
  ganShiShen: ShiShen;
  relations: GanzhiRelation[];
  isCurrent: boolean;
}

export type SihuaType = "禄" | "权" | "科" | "忌";

export interface Sihua {
  type: SihuaType;
  star: string;
  /** 該化星所在的本命宮位名(即"化X飛入本命某宮") */
  intoPalace: string;
}

export interface ZiweiScopeFortune {
  scope: "大限" | "流年";
  year?: number;
  heavenlyStem: string;
  earthlyBranch: string;
  /** 該運/年命宮落在本命哪個宮位名 */
  palaceName: string;
  sihua: Sihua[];
}

export interface FortuneAnalysis {
  referenceYear: number;
  bazi: {
    dayMaster: Tiangan;
    useGods: Tiangan[];
    useGodsReviewed: boolean;
    daYun: DaYunAnalysis[];
    liuNian: LiuNianAnalysis[];
    /** 起運前虛運段嘅小運;起運後唔出 */
    xiaoYun: { year: number; age: number; ganZhi: string }[];
    /** referenceYear 流年嘅 12 個月;搵唔到 → [] */
    liuYue: LiuYueAnalysis[];
  };
  ziwei: {
    decadal: ZiweiScopeFortune;
    yearly: ZiweiScopeFortune[];
  };
}

const SIHUA_ORDER: SihuaType[] = ["禄", "权", "科", "忌"];

/**
 * 動態運勢分析:把"靜"的命盤和"動"的大運流年結合。
 * - 八字:每步大運/窗口內流年的十神 + 是否引動喜用神(補救/受困信號)
 * - 紫微:大限 / 流年四化飛入本命哪個宮
 *
 * @param opts.referenceYear 參考年(默認當前年);用於標記"當前所處運/年"。
 * @param opts.yearsAhead    向後展開的流年數(默認 8)。
 * @param opts.yearsBack     向前回看的流年數(默認 0;>0 時納入已過年份供"回看驗證")。
 */
export function analyzeFortune(
  input: BirthInput,
  opts: { referenceYear?: number; yearsAhead?: number; yearsBack?: number; now?: Date } = {},
): FortuneAnalysis {
  validateBirthInput(input);
  const now = opts.now ?? new Date();
  const referenceYear = opts.referenceYear ?? now.getFullYear();
  const yearsAhead = opts.yearsAhead ?? 8;
  const yearsBack = opts.yearsBack ?? 0;
  const windowEnd = referenceYear + yearsAhead;
  const windowStart = referenceYear - yearsBack;

  const t = resolveBirthDateTime(input);
  const bazi = castBazi(input);
  const dayMaster = bazi.dayMaster;
  const useGods = new Set<string>(bazi.tiaohou.useGods);
  const suppliesUseGod = (gan: string, hide: Tiangan[]): boolean =>
    useGods.has(gan) || hide.some((g) => useGods.has(g));

  // —— 紫微排盤(先建,大運循環裡要逐運判定同期大限) ——
  const a = astro.bySolar(
    `${t.year}-${t.month}-${t.day}`,
    hourToTimeIndex(t.hour),
    input.gender,
    true,
    "zh-CN",
  );
  const starToPalace = buildStarToPalace(a.palaces);
  const palaceNameByIndex = new Map<number, string>(
    a.palaces.map((p) => [p.index, p.name]),
  );

  const toScope = (
    scope: "大限" | "流年",
    h: { heavenlyStem: string; earthlyBranch: string; mutagen: string[]; index: number },
    year?: number,
  ): ZiweiScopeFortune => ({
    scope,
    year,
    heavenlyStem: h.heavenlyStem,
    earthlyBranch: h.earthlyBranch,
    palaceName: palaceNameByIndex.get(h.index) ?? "未知",
    sihua: h.mutagen.map((star, i) => ({
      type: SIHUA_ORDER[i] ?? "禄",
      star,
      intoPalace: starToPalace.get(star) ?? "未入盘",
    })),
  });

  // —— 八字大運 ——
  const ec = Solar.fromYmdHms(
    t.year, t.month, t.day, t.hour, t.minute, 0,
  ).getLunar().getEightChar();
  const rawDaYun = ec.getYun(input.gender === "男" ? 1 : 0).getDaYun();

  const daYun: DaYunAnalysis[] = [];
  const liuNian: LiuNianAnalysis[] = [];
  const natal = bazi.fourPillars;
  const xiaoYun: { year: number; age: number; ganZhi: string }[] = [];

  for (const d of rawDaYun) {
    const ganZhi = d.getGanZhi();
    if (ganZhi.trim().length !== 2) {
      xiaoYun.push(...d.getXiaoYun().map((x) => ({ year: x.getYear(), age: x.getAge(), ganZhi: x.getGanZhi() })));
      continue;
    } // 跳過起運前虛運
    const gan = ganZhi[0]!;
    const zhi = ganZhi[1]!;
    const hide = dizhiHideGan(zhi);
    const startYear = d.getStartYear();
    const endYear = startYear + 9;
    if (!isTiangan(gan)) continue;

    daYun.push({
      ganZhi, gan, zhi,
      startAge: d.getStartAge(),
      endAge: d.getEndAge(),
      startYear,
      endYear,
      ganShiShen: shiShen(dayMaster, gan),
      hideShiShen: hide.map((g) => ({ gan: g, shiShen: shiShen(dayMaster, g) })),
      suppliesUseGod: suppliesUseGod(gan, hide),
      isCurrent: referenceYear >= startYear && referenceYear <= endYear,
      // 該運中點年份時的紫微大限(四化飛入本命宮)。
      // 用中點而非起點:首步大運的起點年齡常落在首個大限區間之前,
      // 此時 horoscope 會迴繞到末個大限(iztro 行為),給出錯誤的大限;
      // 中點恆落在某大限區間內,結果穩定。
      ziweiDecadal: toScope(
        "大限",
        a.horoscope(`${Math.round((startYear + endYear) / 2)}-6-1`).decadal,
      ),
      relations: externalRelations({ ganZhi, role: "dayun" }, natal),
      tianKeDiChong: tianKeDiChong(ganZhi, natal),
    });

    // 該運內、落在窗口的流年
    for (const y of d.getLiuNian()) {
      const year = y.getYear();
      if (year < windowStart || year > windowEnd) continue;
      const yGanZhi = y.getGanZhi();
      const yGan = yGanZhi[0]!;
      const yHide = dizhiHideGan(yGanZhi[1]!);
      if (!isTiangan(yGan)) continue;
      liuNian.push({
        year,
        age: y.getAge(),
        ganZhi: yGanZhi,
        ganShiShen: shiShen(dayMaster, yGan),
        suppliesUseGod: suppliesUseGod(yGan, yHide),
        isReference: year === referenceYear,
        isPast: year < referenceYear,
        relations: externalRelations({ ganZhi: yGanZhi, role: "liunian" }, natal),
        tianKeDiChong: tianKeDiChong(yGanZhi, natal),
        suiYunBingLin: suiYunBingLin(ganZhi, yGanZhi),
      });
    }
  }

  // —— 流月:referenceYear 嗰年(搵遍所有原始大運,包括虛運) ——
  const refLiuNian = rawDaYun.flatMap((d) => d.getLiuNian()).find((y) => y.getYear() === referenceYear);
  // 流年 referenceYear 嘅流月由立春起、至翌年立春止(子/丑月落喺翌年公曆 1 月)。
  // 以節氣表實際交節時刻判定「而家」落喺邊個月,唔可以用公曆年 + 月支對(立春前會錯位)。
  const jq = Solar.fromYmd(referenceYear, 6, 1).getLunar().getJieQiTable();
  const monthStarts = [
    "立春", "惊蛰", "清明", "立夏", "芒种", "小暑", "立秋", "白露", "寒露", "立冬", "大雪", "XIAO_HAN", "LI_CHUN",
  ].map((k) => jq[k]!.toYmdHms());
  const nowYmdHms = Solar.fromDate(now).toYmdHms();
  const liuYue: LiuYueAnalysis[] = (refLiuNian?.getLiuYue() ?? []).map((m) => {
    const ganZhi = m.getGanZhi();
    const i = m.getIndex();
    return {
      index: i,
      monthName: m.getMonthInChinese(),
      ganZhi,
      ganShiShen: shiShen(dayMaster, ganZhi[0] as Tiangan),
      relations: externalRelations({ ganZhi, role: "liuyue" }, natal),
      isCurrent: monthStarts[i]! <= nowYmdHms && nowYmdHms < monthStarts[i + 1]!,
    };
  });

  // —— 紫微大限(當前) / 流年四化 ——
  // a / starToPalace / palaceNameByIndex / toScope 已在上方定義,此處複用。
  const decadalH = a.horoscope(`${referenceYear}-6-1`);
  const decadal = toScope("大限", decadalH.decadal);

  const yearly: ZiweiScopeFortune[] = [];
  for (let year = Math.max(windowStart, t.year); year <= windowEnd; year++) {
    const h = a.horoscope(`${year}-6-1`);
    yearly.push(toScope("流年", h.yearly, year));
  }

  return {
    referenceYear,
    bazi: {
      dayMaster,
      useGods: bazi.tiaohou.useGods,
      useGodsReviewed: bazi.tiaohou.reviewed,
      daYun,
      liuNian,
      xiaoYun,
      liuYue,
    },
    ziwei: { decadal, yearly },
  };
}

interface RawPalace {
  index: number;
  name: string;
  majorStars: { name: string }[];
  minorStars: { name: string }[];
  adjectiveStars: { name: string }[];
}

/** 建立"星曜名 → 本命宮位名"映射,用於判定四化飛入哪個宮。 */
export function buildStarToPalace(palaces: RawPalace[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const p of palaces) {
    for (const s of [...p.majorStars, ...p.minorStars, ...p.adjectiveStars]) {
      if (!map.has(s.name)) map.set(s.name, p.name);
    }
  }
  return map;
}
