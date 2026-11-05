import { Solar } from "lunar-javascript";
import { DIZHI, TIANGAN, HUANGJI_YAO, HUANGJI_OPEN_YUN, HUANGJI_CLOSE_YUN, type Cite } from "@numerology/knowledge";
import type { BirthInput } from "./types.js";
import { resolveBirthDateTime } from "./solartime.js";

export interface HuangjiResult {
  /** 干支年(立春分界)對應嘅公元年,天文紀年 */
  ganzhiYear: number;
  ganzhi: string;
  /** 元內第幾年(1 起) */
  yuanYear: number;
  hui: number;
  huiName: string;
  yun: number;
  yunName: string;
  shi: number;
  shiName: string;
  yearInShi: number;
  steps: string[];
  tier: "classical";
  cite: Cite;
}

const gz = (i: number) => TIANGAN[i % 10]! + DIZHI[i % 12]!;
const mod60 = (n: number) => ((n % 60) + 60) % 60;

/**
 * 皇極經世元會運世:一元 12 會、一會 30 運、一運 12 世、一世 30 年。
 * 以唐堯元年甲辰(元內第 2156 世第 11 年,前 2357 年)為錨,出生干支年(立春分界)推元內年序。
 */
export function castHuangji(input: BirthInput): HuangjiResult {
  const t = resolveBirthDateTime(input);
  const ganzhi = Solar.fromYmdHms(t.year, t.month, t.day, t.hour, t.minute, 0).getLunar().getEightChar().getYear();
  // 立春前出生屬上一干支年。
  const ganzhiYear = gz(mod60(t.year - 4)) === ganzhi ? t.year : t.year - 1;
  const yao = HUANGJI_YAO;
  const yaoIndex = (yao.shi - 1) * 30 + yao.yearInShi;
  const yuanYear = yaoIndex + (ganzhiYear - yao.ad);
  const hui = Math.ceil(yuanYear / 10800);
  const yun = Math.ceil(yuanYear / 360);
  const shi = Math.ceil(yuanYear / 30);
  const yearInShi = yuanYear - (shi - 1) * 30;
  const r = {
    huiName: DIZHI[hui - 1]!, yunName: TIANGAN[(yun - 1) % 10]!, shiName: DIZHI[(shi - 1) % 12]!,
  };
  const phase = yun < HUANGJI_OPEN_YUN ? "開物之前" : yun > HUANGJI_CLOSE_YUN ? "閉物之後" : "開物之後、閉物之前";
  const steps = [
    `出生年柱 ${ganzhi}(立春分界),對應公元 ${ganzhiYear} 年。`,
    `一元 = 12 會 × 30 運 × 12 世 × 30 年 = 129600 年;會用地支、運用天干、世用地支循環命名。`,
    `錨點:唐堯元年甲辰 = 元內第 ${yaoIndex} 年(第 ${yao.shi} 世第 ${yao.yearInShi} 年)= 公元前 2357 年。`,
    `元內年序 = ${yaoIndex} + (${ganzhiYear} − (${yao.ad})) = ${yuanYear};干支覆核:第 ${yuanYear} 年 = ${gz(yuanYear - 1)}。`,
    `會 = ⌈${yuanYear} ÷ 10800⌉ = ${hui}(${r.huiName}會);運 = ⌈${yuanYear} ÷ 360⌉ = ${yun}(${r.yunName});世 = ⌈${yuanYear} ÷ 30⌉ = ${shi}(${r.shiName}),世內第 ${yearInShi} 年。`,
    `書載開物於寅會第 ${HUANGJI_OPEN_YUN} 運、閉物於戌會第 ${HUANGJI_CLOSE_YUN} 運:出生落${phase}。`,
  ];
  return {
    ganzhiYear, ganzhi, yuanYear, hui, yun, shi, yearInShi, ...r, steps,
    tier: "classical",
    cite: { work: "皇極經世書", author: "邵雍", locator: "觀物篇·以會經運" },
  };
}
