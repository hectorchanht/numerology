import { castBazi } from "./bazi.js";
import { castZiwei } from "./ziwei.js";
import type { BirthInput, Gender } from "./types.js";

/** 時辰推斷輸入:只知年月日 + 性別(+ 可選經度),不知時辰。 */
export interface HourInferInput {
  year: number;
  month: number;
  day: number;
  gender: Gender;
  longitude?: number;
}

/** 十二時辰的代表小時(取時段中點附近,避開交界)。 */
const SHICHEN = [
  { zhi: "子", label: "子时", range: "23:00–01:00", hour: 0 },
  { zhi: "丑", label: "丑时", range: "01:00–03:00", hour: 2 },
  { zhi: "寅", label: "寅时", range: "03:00–05:00", hour: 4 },
  { zhi: "卯", label: "卯时", range: "05:00–07:00", hour: 6 },
  { zhi: "辰", label: "辰时", range: "07:00–09:00", hour: 8 },
  { zhi: "巳", label: "巳时", range: "09:00–11:00", hour: 10 },
  { zhi: "午", label: "午时", range: "11:00–13:00", hour: 12 },
  { zhi: "未", label: "未时", range: "13:00–15:00", hour: 14 },
  { zhi: "申", label: "申时", range: "15:00–17:00", hour: 16 },
  { zhi: "酉", label: "酉时", range: "17:00–19:00", hour: 18 },
  { zhi: "戌", label: "戌时", range: "19:00–21:00", hour: 20 },
  { zhi: "亥", label: "亥时", range: "21:00–23:00", hour: 22 },
] as const;

/** 一個時辰候選命盤的區分特徵(供 AI 比對反推)。 */
export interface HourCandidate {
  shichen: string;
  range: string;
  /** 代表小時(用於採用此時辰後填表) */
  hour: number;
  /** 八字時柱干支 + 天干十神(同一天僅時柱隨時辰變) */
  baziHour: { ganZhi: string; shiShenGan: string; shiShenZhi: string[] };
  /** 紫微命宮地支 */
  soulBranch: string;
  /** 命宮主星 */
  soulMajorStars: string[];
  /** 五行局 */
  fiveElementsClass: string;
  soul: string;
  body: string;
  /** 身宮所在宮名 */
  bodyPalaceName: string;
  /** 命宮三方四正合看主星(定格局的依據) */
  sanFangStars: string[];
}

/**
 * 爲同一天生成 12 個時辰的候選命盤區分特徵。
 * 時辰主要改變紫微命宮(12 個時辰=12 套不同格局),八字僅時柱變。
 */
export function castHourCandidates(input: HourInferInput): HourCandidate[] {
  return SHICHEN.map((s) => {
    const full: BirthInput = {
      year: input.year, month: input.month, day: input.day,
      hour: s.hour, minute: 0, gender: input.gender,
      ...(input.longitude !== undefined ? { longitude: input.longitude } : {}),
    };
    const bazi = castBazi(full);
    const ziwei = castZiwei(full);
    const soulP = ziwei.palaces.find((p) => p.isSoulPalace);
    const bodyP = ziwei.palaces.find((p) => p.isBodyPalace);
    return {
      shichen: s.label,
      range: s.range,
      hour: s.hour,
      baziHour: {
        ganZhi: bazi.fourPillars.hour.ganZhi,
        shiShenGan: bazi.fourPillars.hour.shiShenGan,
        shiShenZhi: bazi.fourPillars.hour.shiShenZhi,
      },
      soulBranch: ziwei.soulPalaceBranch,
      soulMajorStars: soulP?.majorStars.map((x) => x.name) ?? [],
      fiveElementsClass: ziwei.fiveElementsClass,
      soul: ziwei.soul,
      body: ziwei.body,
      bodyPalaceName: bodyP?.name ?? "",
      sanFangStars: ziwei.soulSanFang.majorStars,
    };
  });
}
