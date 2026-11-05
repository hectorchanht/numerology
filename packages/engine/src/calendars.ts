import { LunarYear } from "lunar-javascript";
import {
  BEHENIAN, EGYPTIAN_CIVIL, FACES, METONIC, NAKSHATRAS, VIMSHOTTARI,
  type Cite, type DashaLord, type Planet, type Sign,
} from "@numerology/knowledge";
import type { BirthInput } from "./types.js";
import type { EphemerisResult } from "./ephemeris.js";
import { starLongitude } from "./lore.js";
import { gregorianToJdn } from "./maya.js";

const norm = (d: number) => ((d % 360) + 360) % 360;
const NAK = 360 / 27;
const DAY_MS = 86400000;

/* ───────────── Jyotish:宿位與 Vimshottari ───────────── */

export interface Dasha { lord: DashaLord; years: number; startAge: number; endAge: number; start: string; end: string; partial: boolean }

export interface JyotishResult {
  ayanamsa: number;
  moonSidereal: number;
  nakshatra: { n: number; iast: string; devanagari: string; lord: DashaLord };
  /** 月亮在宿內已行比例(0–1) */
  elapsed: number;
  dashas: Dasha[];
  steps: string[];
  tier: "classical";
  cite: Cite;
  ayanamsaCite: Cite;
}

const isoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const r2 = (x: number) => Math.round(x * 100) / 100;

/** 月亮恆星黃道宿位 → Vimshottari 九運(首運按宿內未行之弧折算)。年長 365.25 日。 */
export function castJyotish(sky: EphemerisResult): JyotishResult {
  const when = new Date(sky.utc);
  const spica = BEHENIAN.stars.find((s) => s.name === "Spica")!;
  // Chitrapaksha:Spica 恆星黃經定為 180°
  const ayanamsa = norm(starLongitude(spica.ra, spica.dec, when) - 180);
  const moon = sky.planets.find((p) => p.planet === "Moon")!;
  const moonSidereal = norm(moon.longitude - ayanamsa);
  const idx = Math.floor(moonSidereal / NAK);
  const nak = NAKSHATRAS[idx]!;
  const elapsed = (moonSidereal - idx * NAK) / NAK;

  const first = VIMSHOTTARI.order.indexOf(nak.lord);
  const yearMs = VIMSHOTTARI.yearDays * DAY_MS;
  const birth = when.getTime();
  const dashas: Dasha[] = [];
  let age = 0;
  for (let k = 0; k < 9; k++) {
    const lord = VIMSHOTTARI.order[(first + k) % 9]!;
    const full = VIMSHOTTARI.years[lord];
    const years = k === 0 ? full * (1 - elapsed) : full;
    dashas.push({
      lord, years, startAge: age, endAge: age + years, partial: k === 0,
      start: isoDate(birth + age * yearMs), end: isoDate(birth + (age + years) * yearMs),
    });
    age += years;
  }
  const deg = (d: number) => `${Math.floor(d)}°${String(Math.floor((d % 1) * 60)).padStart(2, "0")}′`;
  const steps = [
    `ayanamsa(Lahiri / Chitrapaksha):Spica 出生時回歸黃經 − 180° = ${deg(ayanamsa)}。ayanamsa 有多家(Lahiri、Raman、Krishnamurti 等),相差可達 1° 以上。`,
    `月亮回歸黃經 ${deg(moon.longitude)} − ayanamsa = 恆星黃經 ${deg(moonSidereal)}。`,
    `每宿 13°20′:${deg(moonSidereal)} ÷ 13°20′ → 第 ${nak.n} 宿 ${nak.iast}(${nak.devanagari}),宿內已行 ${(elapsed * 100).toFixed(1)}%。`,
    `宿主 ${nak.lord}:首運 ${nak.lord} 全長 ${VIMSHOTTARI.years[nak.lord]} 年 × 未行 ${((1 - elapsed) * 100).toFixed(1)}% = ${r2(dashas[0]!.years)} 年(${VIMSHOTTARI.locator})。`,
    `其後按運序 ${VIMSHOTTARI.order.join("、")} 循環,九運共 ${VIMSHOTTARI.total} 年。年長取 ${VIMSHOTTARI.yearDays} 日(另有 ${VIMSHOTTARI.yearDaysAlt} 日 savana 年一說,起訖會相差數年)。`,
    idx === 0 || elapsed < 0.02 || elapsed > 0.98 ? "月亮貼近宿界,換用其他 ayanamsa 可能落在鄰宿,首運隨之不同。" : "",
  ].filter(Boolean);
  return {
    ayanamsa, moonSidereal, nakshatra: nak, elapsed, dashas, steps,
    tier: "classical",
    cite: { work: "Brihat Parashara Hora Shastra", locator: "行星大運章 v.12–16(Santhanam 英譯章號 46 或 47)" },
    ayanamsaCite: { work: "Ayanamsa", author: "Wikipedia", locator: "Chitrapaksha(Lahiri):Spica = 180°" },
  };
}

/* ───────────── 埃及民用曆與 face ───────────── */

export interface EgyptianResult {
  jdn: number;
  year: number;
  /** 0–11 為月,12 為閏餘日(Epagomenae) */
  monthIndex: number;
  month: string;
  day: number;
  face: { sign: Sign; index: number; ruler: Planet };
  steps: string[];
  tier: "classical";
  cite: Cite;
  faceCite: Cite;
}

export function castEgyptian(input: BirthInput, sky: EphemerisResult): EgyptianResult {
  const jdn = gregorianToJdn(input.year, input.month, input.day);
  const days = jdn - EGYPTIAN_CIVIL.epoch.jdn;
  const year = Math.floor(days / 365) + 1;
  const doy = ((days % 365) + 365) % 365;
  const monthIndex = Math.min(12, Math.floor(doy / EGYPTIAN_CIVIL.monthDays));
  const day = doy - monthIndex * EGYPTIAN_CIVIL.monthDays + 1;
  const month = monthIndex === 12 ? EGYPTIAN_CIVIL.epagomenal : EGYPTIAN_CIVIL.months[monthIndex]!;

  const sun = sky.planets.find((p) => p.planet === "Sun")!;
  const signIdx = Math.floor(sun.longitude / 30);
  const index = Math.floor((sun.longitude % 30) / 10);
  const f = FACES[signIdx]!;
  const face = { sign: f.sign, index, ruler: f.rulers[index]! };
  const steps = [
    `出生民用日 ${input.year}-${input.month}-${input.day} → 儒略日數 ${jdn}。`,
    `Nabonassar 紀元 Thoth 1 = 儒略曆公元前 747 年 2 月 26 日(JDN ${EGYPTIAN_CIVIL.epoch.jdn})。相距 ${days} 日。`,
    `每年固定 365 日、不置閏:${days} ÷ 365 → 第 ${year} 年第 ${doy + 1} 日 → ${month} ${day} 日。每年比回歸年短約 ¼ 日,所以月份逐年沿季節倒退,約 1460 年繞一周。`,
    `太陽回歸黃經 ${sun.longitude.toFixed(2)}° → ${f.sign} 第 ${index + 1} 個 10°(face),主星 ${face.ruler}(迦勒底序由白羊 0° 火星起)。`,
    "face 是希臘化時期把埃及 36 旬星改為黃道每 10° 一段的做法;原本旬星所指的星今已難以確認。",
  ];
  return {
    jdn, year, monthIndex, month, day, face, steps,
    tier: "classical",
    cite: { work: "Almagest", author: "Ptolemy", locator: "III.7(Nabonassar 紀元)" },
    faceCite: { work: "Christian Astrology", author: "William Lilly", year: 1647, locator: "頁 104–105(經 Wikipedia 'Decan (astrology)')" },
  };
}

/* ───────────── 十九年週期 ───────────── */

export interface MetonicResult {
  golden: number;
  epact: number;
  easter: { month: number; day: number };
  /** 出生農曆年起 19 年:各年閏月(0 = 無) */
  leaps: { year: number; leapMonth: number }[];
  leapCount: number;
  /** 235 朔望月與 19 回歸年之差(小時) */
  driftHours: number;
  steps: string[];
  tier: "classical";
  cite: Cite;
  chineseCite: Cite;
}

const SYNODIC = 29.530589, TROPICAL = 365.24219;

export function castMetonic(year: number): MetonicResult {
  const golden = (year % 19) + 1;
  const c = Math.floor(year / 100) + 1;
  const epact = (((11 * golden - Math.floor((3 * c) / 4) + Math.floor((8 * c + 5) / 25) + 27) % 30) + 30) % 30;
  // Meeus / Jones / Butcher(Gregorian)
  const a = year % 19, b = Math.floor(year / 100), cc = year % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(cc / 4), k = cc % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const easter = { month: Math.floor((h + l - 7 * m + 114) / 31), day: ((h + l - 7 * m + 114) % 31) + 1 };

  const leaps = Array.from({ length: 19 }, (_, j) => ({ year: year + j, leapMonth: LunarYear.fromYear(year + j).getLeapMonth() }));
  const leapCount = leaps.filter((x) => x.leapMonth).length;
  const driftHours = (METONIC.meton.months * SYNODIC - METONIC.meton.years * TROPICAL) * 24;
  const ch = METONIC.chinese;
  const steps = [
    `金數 = (${year} mod 19) + 1 = ${golden}:此年在 19 年週期的第 ${golden} 年。`,
    `Gregorian epact:C = ⌊${year}/100⌋ + 1 = ${c};(11 × ${golden} − ⌊3C/4⌋ + ⌊(8C + 5)/25⌋ + 27) mod 30 = ${epact}(年初月齡約 ${epact} 日)。`,
    `復活節(Meeus / Jones / Butcher):${year} 年 ${easter.month} 月 ${easter.day} 日。`,
    `Meton(${METONIC.meton.locator}):19 年 ≈ ${METONIC.meton.months} 個朔望月;235 × ${SYNODIC} 日比 19 × ${TROPICAL} 日多約 ${driftHours.toFixed(1)} 小時,約 219 年差一日。`,
    `中國四分曆:章法 ${ch.zhang}、章月 ${ch.zhangMonths}、閏七而盡;蔀 ${ch.bu}、紀 ${ch.ji}、元 ${ch.yuan}(${ch.locator})。`,
    `現行農曆(定氣定朔)自 ${year} 年起 19 年實有閏月 ${leapCount} 個:${leaps.filter((x) => x.leapMonth).map((x) => `${x.year} 閏${x.leapMonth}月`).join("、")}。定氣置閏不按固定章法,所以不一定剛好 7 個、位置亦不固定。`,
  ];
  return {
    golden, epact, easter, leaps, leapCount, driftHours, steps,
    tier: "classical",
    cite: { work: "Bibliotheca historica", author: "Diodorus Siculus", locator: "XII.36.2;金數、epact 見 Explanatory Supplement (1961) 頁 421–422" },
    chineseCite: { work: "後漢書", locator: "志第三 律曆下 曆法" },
  };
}
