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
const wall = (y: number, mo: number, d: number, h = 0, mi = 0, se = 0) => Date.UTC(y, mo - 1, d, h, mi, se);

/**
 * 冬至時刻換到與出生相同的基準:無經度時為北京時間鐘面;有經度時與出生同法校正為真太陽時
 * (經度差 + 冬至當日均時差,沿用 resolveBirthDateTime),秒數照留。
 */
function solsticeMs(year: number, longitude: number | undefined): number {
  const s = solsticeOf(year);
  const r = resolveBirthDateTime({
    year: s.getYear(), month: s.getMonth(), day: s.getDay(), hour: s.getHour(), minute: s.getMinute(),
    gender: "男", longitude,
  });
  return wall(r.year, r.month, r.day, r.hour, r.minute, s.getSecond());
}

/**
 * 太玄 729 贊定位:出生時刻(真太陽時)距出生前最近冬至,以「子夜–正午」半日計。
 * 冬至時刻先換到與出生相同的時間基準;半日序 0 = 冬至時刻所在的半日,
 * 起點 B 為該半日開端(冬至在正午前取當日子夜,否則取當日正午)。
 */
export function castTaixuan(input: BirthInput): TaixuanResult {
  const t = resolveBirthDateTime(input);
  const birth = wall(t.year, t.month, t.day, t.hour, t.minute);
  let wsYear = t.year;
  let T = solsticeMs(wsYear, input.longitude);
  if (birth < T) T = solsticeMs(--wsYear, input.longitude);
  const ws = new Date(T);
  const am = ws.getUTCHours() < 12;
  const start = wall(ws.getUTCFullYear(), ws.getUTCMonth() + 1, ws.getUTCDate(), am ? 0 : 12);
  const halfDayIndex = Math.floor((birth - start) / HALF_DAY);
  // 一週期 = 730.5 個半日再加 (T − B) / 12h,故序 730 每年必有,序 731 約半數年份出現;序 ≥ 730 皆歸嬴。
  const inZan = halfDayIndex < 729;
  const head = inZan ? Math.floor(halfDayIndex / 9) + 1 : null;
  const zan = inZan ? (halfDayIndex % 9) + 1 : null;
  const extra = inZan ? null : halfDayIndex === 729 ? "踦" : "嬴";
  const h = head ? taixuanHead(head) : null;

  const winterSolstice = {
    year: ws.getUTCFullYear(), month: ws.getUTCMonth() + 1, day: ws.getUTCDate(),
    hour: ws.getUTCHours(), minute: ws.getUTCMinutes(),
  };
  const wsText = `${winterSolstice.year}-${pad(winterSolstice.month)}-${pad(winterSolstice.day)} ${pad(winterSolstice.hour)}:${pad(winterSolstice.minute)}`;
  const steps = [
    `取用出生時刻 ${t.year}-${pad(t.month)}-${pad(t.day)} ${pad(t.hour)}:${pad(t.minute)}${t.correction.applied ? "(已校正真太陽時)" : ""}。`,
    `出生前最近一個冬至:${wsText}(${t.correction.applied ? `與出生同法換算為真太陽時,經度 ${input.longitude}°` : "北京時間鐘面,與出生同一基準"})。`,
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
