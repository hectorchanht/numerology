import { Solar } from "lunar-javascript";
import { taixuanHead, type Cite } from "@numerology/knowledge";
import type { BirthInput } from "./types.js";
import { resolveBirthDateTime } from "./solartime.js";

export interface TaixuanResult {
  winterSolstice: { year: number; month: number; day: number; hour: number; minute: number };
  halfDayIndex: number;
  head: number | null;
  zan: number | null;
  extra: "踦" | "嬴" | null;
  headName: string | null;
  steps: string[];
  tier: "classical";
  cite: Cite;
}

const HALF_DAY = 12 * 3600 * 1000;
const pad = (n: number) => String(n).padStart(2, "0");

/** 公曆某年 12 月冬至時刻(lunar-javascript 節氣表;年中取表,DONG_ZHI 即當年冬至)。 */
function solsticeOf(year: number): Solar {
  return Solar.fromYmd(year, 7, 1).getLunar().getJieQiTable()["DONG_ZHI"]!;
}

/** 以 UTC 欄位當作「無時區」的牆鐘時刻,只用於相減。 */
const ms = (s: Solar) =>
  Date.UTC(s.getYear(), s.getMonth() - 1, s.getDay(), s.getHour(), s.getMinute(), s.getSecond());

/**
 * 太玄 729 贊定位:出生時刻(真太陽時)距出生前最近冬至,以「子夜–正午」半日計。
 * 半日序 0 = 冬至時刻所在的半日;起點 B 為該半日開端(冬至在正午前取當日子夜,否則取當日正午)。
 */
export function castTaixuan(input: BirthInput): TaixuanResult {
  const t = resolveBirthDateTime(input);
  const birth = Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute);
  let ws = solsticeOf(t.year);
  if (birth < ms(ws)) ws = solsticeOf(t.year - 1);
  const am = ws.getHour() < 12;
  const start = Date.UTC(ws.getYear(), ws.getMonth() - 1, ws.getDay(), am ? 0 : 12);
  const halfDayIndex = Math.floor((birth - start) / HALF_DAY);
  // ponytail: 一歲約 730.5 個半日,序 ≥ 730 一律歸嬴(含極少數的第 731 個半日)。
  const inZan = halfDayIndex < 729;
  const head = inZan ? Math.floor(halfDayIndex / 9) + 1 : null;
  const zan = inZan ? (halfDayIndex % 9) + 1 : null;
  const extra = inZan ? null : halfDayIndex === 729 ? "踦" : "嬴";
  const h = head ? taixuanHead(head) : null;

  const winterSolstice = {
    year: ws.getYear(), month: ws.getMonth(), day: ws.getDay(), hour: ws.getHour(), minute: ws.getMinute(),
  };
  const wsText = `${winterSolstice.year}-${pad(winterSolstice.month)}-${pad(winterSolstice.day)} ${pad(winterSolstice.hour)}:${pad(winterSolstice.minute)}`;
  const steps = [
    `取用出生時刻 ${t.year}-${pad(t.month)}-${pad(t.day)} ${pad(t.hour)}:${pad(t.minute)}${t.correction.applied ? "(已校正真太陽時)" : ""}。`,
    `出生前最近一個冬至:${wsText}。`,
    `半日以子夜、正午等分(本站採此法;另有以日出日落切分者)。冬至所在半日為第 0 個,起於當日${am ? "子夜 00:00" : "正午 12:00"}。`,
    `自該起點至出生共 ${halfDayIndex} 個完整半日,得半日序 ${halfDayIndex}。`,
    inZan
      ? `首 = ⌊${halfDayIndex} ÷ 9⌋ + 1 = ${head}(${h!.name}),贊 = ${halfDayIndex} mod 9 + 1 = ${zan}。`
      : `半日序 ≥ 729,已過 81 首 × 9 贊;第 729 個半日為踦,其後為嬴,得「${extra}」。`,
  ];
  return {
    winterSolstice, halfDayIndex, head, zan, extra, headName: h?.name ?? null, steps,
    tier: "classical",
    cite: h?.cite ?? { work: "太玄經", author: "揚雄", locator: "踦、嬴二贊" },
  };
}
