import * as Astro from "astronomy-engine";
import {
  ASPECTS, DOMICILE, EGYPTIAN_TERMS, EXALTATION, LUNAR_MANSIONS, SIGNS, TRIPLICITY,
  type Cite, type Planet, type Sign,
} from "@numerology/knowledge";
import type { BirthInput } from "./types.js";

export interface PlanetPosition {
  planet: Planet;
  /** 回歸黃經(當日真春分),度 */
  longitude: number;
  sign: Sign;
  /** 宮內度數 0–30 */
  degree: number;
  retrograde: boolean;
  /** 宮主 */
  ruler: Planet;
  /** 入廟 / 入旺 / 落陷(Ptolemy 卷一只講廟旺同落陷,唔另計「失勢」) */
  dignities: ("domicile" | "exaltation" | "fall")[];
  /** 三方主星;晝夜未知時兩個都列 */
  triplicityRulers: Planet[];
  /** 埃及界主 */
  termRuler: Planet;
  /** 整宮制宮位(上升所在宮 = 第 1 宮);缺經緯度 → null */
  house: number | null;
}

export interface AspectHit {
  a: Planet;
  b: Planet;
  type: keyof typeof ASPECTS;
  /** 實際黃經差(0–180) */
  separation: number;
}

export interface EphemerisResult {
  /** 推算用 UTC 時刻(ISO) */
  utc: string;
  planets: PlanetPosition[];
  /** 整宮相位(按宮距) */
  aspects: AspectHit[];
  /** 晝生 / 夜生(太陽喺地平上下);缺經緯度 → null */
  sect: "day" | "night" | null;
  /** 上升點同天頂(回歸黃經);缺經緯度 → null */
  angles: { ascendant: number; ascSign: Sign; mc: number; mcSign: Sign } | null;
  moonMansion: { n: number; names: string[]; meaning: string | null; start: number };
  steps: string[];
  tier: "classical";
  cite: Cite;
  mansionCite: Cite;
}

const BODIES: Planet[] = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];
/** 鐘面時間按東八區(與 solartime.ts 標準經線 120° 一致)。 */
const CLOCK_UTC_OFFSET = 8;
const MANSION = 360 / 28;
/** 宮距 → 托勒密相位 */
const SIGN_GAP: Record<number, keyof typeof ASPECTS> = { 2: "sextile", 3: "quartile", 4: "trine", 6: "opposition" };

const lonOf = (body: Planet, t: Astro.AstroTime) => Astro.Ecliptic(Astro.GeoVector(body as Astro.Body, t, true)).elon;
const rad = Math.PI / 180;
const norm = (d: number) => ((d % 360) + 360) % 360;
const dms = (d: number) => `${Math.floor(d)}°${String(Math.floor((d % 1) * 60)).padStart(2, "0")}′`;

/**
 * 出生時刻七曜黃道位置(astronomy-engine,VSOP87 / ELP 截斷式,誤差約 1′),
 * 配 Tetrabiblos 卷一尊貴表同 Agrippa 二十八月宿。
 * 鐘面時間當東八區處理,未計夏令時;1986–1991 年夏令時期間出生要自行減一小時。
 */
export function castEphemeris(input: BirthInput): EphemerisResult {
  const ms = Date.UTC(input.year, input.month - 1, input.day, input.hour - CLOCK_UTC_OFFSET, input.minute ?? 0);
  const t = Astro.MakeTime(new Date(ms));
  const day = Astro.MakeTime(new Date(ms + 86400000));
  const prev = Astro.MakeTime(new Date(ms - 86400000));

  let sect: EphemerisResult["sect"] = null;
  let angles: EphemerisResult["angles"] = null;
  if (input.latitude != null && input.longitude != null) {
    const obs = new Astro.Observer(input.latitude, input.longitude, 0);
    const eq = Astro.Equator(Astro.Body.Sun, t, obs, true, true);
    sect = Astro.Horizon(t, obs, eq.ra, eq.dec).altitude > 0 ? "day" : "night";
    // 地方恆星時 θ(= 天頂赤經)+ 真黃赤交角 ε → 天頂、上升(球面三角標準式)
    const th = norm(Astro.SiderealTime(t) * 15 + input.longitude) * rad;
    const e = Astro.e_tilt(t).tobl * rad;
    const mc = norm(Math.atan2(Math.sin(th), Math.cos(th) * Math.cos(e)) / rad);
    const ascendant = norm(Math.atan2(Math.cos(th), -(Math.sin(th) * Math.cos(e) + Math.tan(input.latitude * rad) * Math.sin(e))) / rad);
    angles = { ascendant, ascSign: SIGNS[Math.floor(ascendant / 30)]!, mc, mcSign: SIGNS[Math.floor(mc / 30)]! };
  }
  const ascIdx = angles ? SIGNS.indexOf(angles.ascSign) : -1;

  const planets = BODIES.map((planet): PlanetPosition => {
    const longitude = lonOf(planet, t);
    const sign = SIGNS[Math.floor(longitude / 30)]!;
    const degree = longitude % 30;
    // 前後一日黃經差判逆行(日月永不逆行)
    const motion = ((lonOf(planet, day) - lonOf(planet, prev) + 540) % 360) - 180;
    const ex = EXALTATION[planet];
    const tri = TRIPLICITY.find((x) => x.signs.includes(sign))!;
    let acc = 0;
    const term = EGYPTIAN_TERMS[sign].find((x) => degree < (acc += x.deg))!;
    return {
      planet, longitude, sign, degree,
      retrograde: motion < 0,
      ruler: DOMICILE[sign],
      dignities: [
        ...(DOMICILE[sign] === planet ? ["domicile" as const] : []),
        ...(ex.sign === sign ? ["exaltation" as const] : []),
        ...(ex.fall === sign ? ["fall" as const] : []),
      ],
      triplicityRulers: sect ? [tri[sect]] : [tri.day, tri.night],
      termRuler: term.planet,
      house: angles ? ((SIGNS.indexOf(sign) - ascIdx + 12) % 12) + 1 : null,
    };
  });

  const aspects: AspectHit[] = [];
  planets.forEach((p, i) => planets.slice(i + 1).forEach((q) => {
    const gap = (SIGNS.indexOf(q.sign) - SIGNS.indexOf(p.sign) + 12) % 12;
    const type = SIGN_GAP[Math.min(gap, 12 - gap)];
    const sep = Math.abs(((q.longitude - p.longitude + 540) % 360) - 180);
    if (type) aspects.push({ a: p.planet, b: q.planet, type, separation: sep });
  }));

  const moon = planets[1]!;
  const mi = Math.floor(moon.longitude / MANSION);
  const m = LUNAR_MANSIONS[mi]!;

  const steps = [
    `鐘面時間 ${input.year}-${input.month}-${input.day} ${input.hour}:${String(input.minute ?? 0).padStart(2, "0")} 按東八區換算 UTC ${new Date(ms).toISOString().slice(0, 16)}Z(未計夏令時)。`,
    "七曜取地心視黃經(含光行差),回歸黃道,當日真春分為 0°。",
    sect ? `太陽${sect === "day" ? "在地平以上,晝生" : "在地平以下,夜生"};三方主星取${sect === "day" ? "晝" : "夜"}主。` : "未填經緯度,不判晝夜生;三方主星晝夜並列。",
    ...planets.map((p) => `${p.planet} ${p.sign} ${dms(p.degree)}${p.retrograde ? "(逆行)" : ""}${p.house ? `,第 ${p.house} 宮` : ""}:宮主 ${p.ruler}${p.dignities.length ? `,${p.dignities.join("、")}` : ""};界主 ${p.termRuler}。`),
    angles
      ? `地方恆星時與黃赤交角求得上升 ${angles.ascSign} ${dms(angles.ascendant % 30)}、天頂 ${angles.mcSign} ${dms(angles.mc % 30)};宮位用整宮制,上升所在宮為第 1 宮。`
      : "未填經緯度,不計上升點與宮位。",
    `月亮黃經 ${dms(moon.longitude)} ÷ ${MANSION.toFixed(4)}° → 第 ${mi + 1} 宿 ${m.names[0]}。`,
  ];

  return {
    utc: new Date(ms).toISOString(), planets, aspects, sect, angles,
    moonMansion: { n: m.n, names: m.names, meaning: m.meaning, start: mi * MANSION },
    steps, tier: "classical",
    cite: { work: "Tetrabiblos", author: "Ptolemy", year: 1822, locator: "Book I, tr. J. M. Ashmand" },
    mansionCite: { work: "Three Books of Occult Philosophy", author: "Agrippa", year: 1651, locator: "Book II ch. 33" },
  };
}
