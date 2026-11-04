import { TZOLKIN_DAY_NAMES, HAAB_MONTHS, type Cite } from "@numerology/knowledge";

export interface MayaResult {
  jdn: number;
  longCount: [number, number, number, number, number];
  tzolkin: { number: number; dayIndex: number; dayName: string };
  haab: { day: number; monthIndex: number; monthName: string };
  correlation: 584283;
  steps: string[];
  cite: Cite;
}

const GMT = 584283;
const mod = (a: number, n: number) => ((a % n) + n) % n;

/** 格里曆 → 儒略日數(標準整數公式,含公元前的天文紀年)。 */
function gregorianToJdn(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy
    + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

/** 瑪雅長紀曆 / Tzolk'in / Haab,以出生民用日期(公曆)計。 */
export function castMaya(year: number, month: number, day: number): MayaResult {
  const jdn = gregorianToJdn(year, month, day);
  const days = jdn - GMT;
  const units = [144000, 7200, 360, 20, 1];
  let rest = days;
  const longCount = units.map((u) => {
    const q = Math.floor(rest / u);
    rest -= q * u;
    return q;
  }) as MayaResult["longCount"];

  // 紀元日 0.0.0.0.0 = 4 Ajaw 8 Kumk'u
  const number = mod(days + 3, 13) + 1;
  const dayIndex = mod(days + 19, 20);
  const pos = mod(days + 17 * 20 + 8, 365);
  const monthIndex = Math.floor(pos / 20);
  const tzolkin = { number, dayIndex, dayName: TZOLKIN_DAY_NAMES[dayIndex]!.name };
  const haab = { day: pos % 20, monthIndex, monthName: HAAB_MONTHS[monthIndex]!.name };

  const steps = [
    `取用出生民用日期 ${year}-${month}-${day}(公曆),以標準整數公式換算儒略日數 JDN = ${jdn}。`,
    `採學界通用 GMT 對應常數 584283(另有 584285 一說,相差 2 日,屬學界爭議):距長紀曆紀元 ${jdn} − 584283 = ${days} 日。`,
    `長紀曆以 144000/7200/360/20/1 日進位(20、18、20、20 進):${longCount.join(".")}。`,
    `紀元日為 4 Ajaw 8 Kumk'u。Tzolk'in 數字 = (${days} + 3) mod 13 + 1 = ${number},日名序 = (${days} + 19) mod 20 = ${dayIndex}(${tzolkin.dayName})。`,
    `Haab 年內序 = (${days} + 348) mod 365 = ${pos},即 ${monthIndex === 18 ? "Wayeb 年末五日" : `第 ${monthIndex + 1} 月`} ${haab.monthName} ${haab.day} 日。`,
  ];
  return {
    jdn, longCount, tzolkin, haab, correlation: GMT, steps,
    cite: { work: "Maya calendar", locator: "https://en.wikipedia.org/wiki/Mesoamerican_Long_Count_calendar" },
  };
}
