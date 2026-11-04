import type { BirthInput } from "./types.js";
import { WUXING } from "./shishen.js";
import { isTiangan } from "@numerology/knowledge";

/** 中國標準時所用經線(東經 120°)。 */
const STANDARD_MERIDIAN = 120;

export interface SolarTimeCorrection {
  /** 是否已做真太陽時校正(提供了經度才會做) */
  applied: boolean;
  longitude?: number;
  /** 總偏移(分鐘,= 經度差 + 均時差) */
  offsetMinutes?: number;
  /** 經度差帶來的偏移(分鐘) */
  longitudeMinutes?: number;
  /** 均時差(分鐘) */
  equationOfTimeMinutes?: number;
}

export interface ResolvedDateTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  correction: SolarTimeCorrection;
}

function isLeap(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/** 一年中的第 N 天(1-366)。 */
function dayOfYear(y: number, m: number, d: number): number {
  const cum = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let n = cum[m - 1]! + d;
  if (m > 2 && isLeap(y)) n += 1;
  return n;
}

/** 均時差(分鐘):真太陽時 − 平太陽時。標準近似公式。 */
function equationOfTime(n: number): number {
  const b = ((2 * Math.PI) / 364) * (n - 81);
  return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
}

/**
 * 把出生時鐘時間換算為【真太陽時】(提供經度時)。
 * 真太陽時 = 時鐘時間 + (經度 − 120)×4 分鐘 + 均時差。
 * 用 UTC 做加減以避免本地時區干擾,確定性。
 */
export function resolveBirthDateTime(input: BirthInput): ResolvedDateTime {
  const minute = input.minute ?? 0;
  const base = {
    year: input.year, month: input.month, day: input.day, hour: input.hour, minute,
  };
  if (input.longitude === undefined || input.longitude === null) {
    return { ...base, correction: { applied: false } };
  }

  const n = dayOfYear(input.year, input.month, input.day);
  const lonMinutes = (input.longitude - STANDARD_MERIDIAN) * 4;
  const eot = equationOfTime(n);
  const offset = Math.round(lonMinutes + eot);

  const ms = Date.UTC(input.year, input.month - 1, input.day, input.hour, minute) + offset * 60000;
  const dt = new Date(ms);

  return {
    year: dt.getUTCFullYear(),
    month: dt.getUTCMonth() + 1,
    day: dt.getUTCDate(),
    hour: dt.getUTCHours(),
    minute: dt.getUTCMinutes(),
    correction: {
      applied: true,
      longitude: input.longitude,
      offsetMinutes: offset,
      longitudeMinutes: Math.round(lonMinutes),
      equationOfTimeMinutes: Math.round(eot),
    },
  };
}

/** 五行 → 方位 / 顏色 / 季節(開運參考)。 */
const WUXING_DIR: Record<string, { direction: string; color: string }> = {
  木: { direction: "东方", color: "青、绿" },
  火: { direction: "南方", color: "红、紫" },
  土: { direction: "中部 / 本地", color: "黄、棕" },
  金: { direction: "西方", color: "白、金" },
  水: { direction: "北方", color: "黑、蓝" },
};

export interface FavorableDirection {
  wuxing: string;
  gans: string[];
  direction: string;
  color: string;
}

/** 由喜用神(天干)推出有利的五行 → 方位 / 顏色。去重合並。 */
export function favorableDirections(useGods: string[]): FavorableDirection[] {
  const byWuXing = new Map<string, string[]>();
  for (const g of useGods) {
    if (!isTiangan(g)) continue;
    const wx = WUXING[g];
    if (!byWuXing.has(wx)) byWuXing.set(wx, []);
    byWuXing.get(wx)!.push(g);
  }
  return [...byWuXing.entries()].map(([wuxing, gans]) => ({
    wuxing,
    gans,
    direction: WUXING_DIR[wuxing]?.direction ?? "",
    color: WUXING_DIR[wuxing]?.color ?? "",
  }));
}
