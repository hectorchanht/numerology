import { ARBATEL_PAGE, CHALDEAN_ORDER, HOUR_NAMES, OLYMPIC_SPIRITS, PLANET_ANGEL, type Cite, type Planet } from "@numerology/knowledge";
import type { BirthInput } from "./types.js";
import { resolveBirthDateTime } from "./solartime.js";

export interface PlanetaryHourResult {
  latitude: number;
  /** 地方視太陽時(有經度)或鐘面時間(無經度),小時 */
  sunrise: number | null;
  sunset: number | null;
  /** 行星日:日出起算,日出前屬前一日 */
  dayPlanet: Planet;
  dayAngel: string;
  /** 日間 / 夜間第幾時(1–12);極晝極夜為 null */
  half: "day" | "night" | null;
  hour: number | null;
  hourName: string | null;
  hourPlanet: Planet | null;
  hourAngel: string | null;
  /** Arbatel 奧林匹亞靈:按行星對應(只係對照,Arbatel 未講行星日時由佢哋管) */
  dayOlympic: string;
  hourOlympic: string | null;
  steps: string[];
  tier: "classical";
  cite: Cite;
  olympicCite: Cite;
}

const olympic = (p: Planet) => OLYMPIC_SPIRITS.find((s) => s.planet === p)!.name;
const RULERS: Planet[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
const WEEK = "日一二三四五六";
const rad = Math.PI / 180;
const hm = (h: number) => {
  const m = Math.round((((h % 24) + 24) % 24) * 60);
  return `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

/** 太陽赤緯(弧度),NOAA 近似式,取當日正午。 */
function declination(year: number, month: number, day: number): number {
  const doy = (Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 1)) / 86400000 + 1;
  const g = ((2 * Math.PI) / 365) * (doy - 1);
  return 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g)
    + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
}

/**
 * Heptameron 行星時:日出至日落、日落至翌日日出各分 12 個不等長時辰;
 * 行星日以日出起,第一時屬該日行星,其後按迦勒底次序輪轉(日間接夜間)。
 * 日出日落以地方視太陽時計(正午 12:00 ± 半晝弧),含 0.833° 大氣折射與日面半徑。
 * 未給緯度 → 返回 null。
 */
export function castPlanetaryHour(input: BirthInput): PlanetaryHourResult | null {
  const lat = input.latitude;
  if (lat === undefined || lat === null) return null;
  const t = resolveBirthDateTime(input);
  const T = t.hour + t.minute / 60;
  const dec = declination(t.year, t.month, t.day);
  const cosH = (Math.cos(90.833 * rad) - Math.sin(lat * rad) * Math.sin(dec)) / (Math.cos(lat * rad) * Math.cos(dec));
  const weekday = new Date(Date.UTC(t.year, t.month - 1, t.day)).getUTCDay();
  const timeBasis = t.correction.applied ? "地方視太陽時" : "鐘面時間(未填經度,日出日落按視太陽時估,誤差可達一小時)";
  const steps = [`取用出生時刻 ${hm(T)}(${timeBasis}),緯度 ${lat}°,當日太陽赤緯 ${(dec / rad).toFixed(2)}°。`];
  const base = {
    latitude: lat, tier: "classical" as const,
    olympicCite: { work: "Arbatel of Magick (Fourth Book of Occult Philosophy)", year: 1655, locator: `tr. R. Turner, p. ${ARBATEL_PAGE}` },
    cite: { work: "Heptameron (Fourth Book of Occult Philosophy)", author: "pseudo-Peter of Abano", year: 1655, locator: "tr. R. Turner, planetary hours" },
  };

  if (Math.abs(cosH) > 1) {
    const dayPlanet = RULERS[weekday]!;
    steps.push(cosH < -1 ? "當日極晝,太陽不落,無法劃分行星時。" : "當日極夜,太陽不升,無法劃分行星時。", `只取星期${WEEK[weekday]}的行星 ${dayPlanet}。`);
    return { ...base, sunrise: null, sunset: null, dayPlanet, dayAngel: PLANET_ANGEL[dayPlanet], half: null, hour: null, hourName: null, hourPlanet: null, hourAngel: null, dayOlympic: olympic(dayPlanet), hourOlympic: null, steps };
  }

  const H = Math.acos(cosH) / rad / 15; // 半晝弧(小時)
  const sunrise = 12 - H, sunset = 12 + H;
  const dayLen = (sunset - sunrise) / 12, nightLen = (24 - (sunset - sunrise)) / 12;
  steps.push(`半晝弧 ${H.toFixed(3)} 小時:日出 ${hm(sunrise)}、日落 ${hm(sunset)};日間每時 ${(dayLen * 60).toFixed(1)} 分,夜間每時 ${(nightLen * 60).toFixed(1)} 分(鄰日赤緯差異忽略)。`);

  let half: "day" | "night", idx: number, wd = weekday;
  if (T >= sunrise && T < sunset) { half = "day"; idx = Math.floor((T - sunrise) / dayLen); }
  else if (T >= sunset) { half = "night"; idx = Math.floor((T - sunset) / nightLen); }
  else { half = "night"; idx = Math.floor((T + 24 - sunset) / nightLen); wd = (weekday + 6) % 7; }
  idx = Math.min(idx, 11);
  const dayPlanet = RULERS[wd]!;
  const n = (half === "day" ? 0 : 12) + idx + 1;
  const hourPlanet = CHALDEAN_ORDER[(CHALDEAN_ORDER.indexOf(dayPlanet) + n - 1) % 7]!;
  const hourName = HOUR_NAMES[half][idx]!;
  steps.push(
    wd === weekday
      ? `${half === "day" ? "日出後" : "日落後"}出生:行星日為星期${WEEK[wd]},屬 ${dayPlanet}。`
      : `日出前出生:仍屬前一日(星期${WEEK[wd]})的夜間,行星日屬 ${dayPlanet}。`,
    `落${half === "day" ? "日間" : "夜間"}第 ${idx + 1} 時(全日第 ${n} 時),時名 ${hourName}。`,
    `第一時屬 ${dayPlanet},按迦勒底次序(${CHALDEAN_ORDER.join("→")})數到第 ${n} 時 = ${hourPlanet},天使 ${PLANET_ANGEL[hourPlanet]}。`,
  );
  return {
    ...base, sunrise, sunset, dayPlanet, dayAngel: PLANET_ANGEL[dayPlanet], half, hour: idx + 1, hourName,
    hourPlanet, hourAngel: PLANET_ANGEL[hourPlanet], dayOlympic: olympic(dayPlanet), hourOlympic: olympic(hourPlanet), steps,
  };
}
