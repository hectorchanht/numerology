import { Solar, type NineStar } from "lunar-javascript";
import type { BirthInput } from "./types.js";
import type { Wuxing5 } from "./wuge.js";
import { resolveBirthDateTime } from "./solartime.js";

export interface NineStarInfo { number: number; name: string; wuxing: Wuxing5; gua: string; direction: string }
export interface NineStarResult {
  year: NineStarInfo;
  month: NineStarInfo;
  date: { year: number; month: number; day: number };
  steps: string[];
}

const CN = "一二三四五六七八九";

function info(s: NineStar): NineStarInfo {
  const cn: string = s.getNumber();
  return {
    number: CN.indexOf(cn) + 1,
    name: cn + s.getColor(),
    wuxing: s.getWuXing() as Wuxing5,
    gua: s.getPosition(),
    direction: s.getPositionDesc(),
  };
}

/** 九星(年星、月星),以立春、節氣換年月,用校正後日期。 */
export function castNineStar(input: BirthInput): NineStarResult {
  const t = resolveBirthDateTime(input);
  const lunar = Solar.fromYmdHms(t.year, t.month, t.day, t.hour, t.minute, 0).getLunar();
  const year = info(lunar.getYearNineStar());
  const month = info(lunar.getMonthNineStar());
  const date = { year: t.year, month: t.month, day: t.day };
  const steps = [
    `取用日期 ${date.year}-${date.month}-${date.day}${t.correction.applied ? "(已校正真太陽時)" : ""}。`,
    `年星以立春為界換年,立春前屬上一年;得年星${year.name}(${year.wuxing},${year.gua}卦,${year.direction})。`,
    `月星以節氣為界換月;得月星${month.name}(${month.wuxing},${month.gua}卦,${month.direction})。`,
  ];
  return { year, month, date, steps };
}
