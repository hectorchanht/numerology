import * as Astro from "astronomy-engine";
import {
  AGRIPPA_SCALES, BEHENIAN, GEMATRIA_TERMS, HEBREW_LETTERS, LULU, NICOMACHUS, SEFER_YETZIRAH, ZODIAC_CORRESPONDENCES,
  type AgrippaScaleRow, type Cite, type GematriaTerm, type KnowledgeTier, type Planet, type Sign,
} from "@numerology/knowledge";
import type { ChartResult } from "./types.js";
import type { EphemerisResult } from "./ephemeris.js";
import { lifePath } from "./lifepath.js";
import { castKamea } from "./kamea.js";
import { castMaya } from "./maya.js";
import { castHeluo } from "./heluo.js";

/* ───────────── Nicomachus 數的分類 ───────────── */

export type ParityClass = "unit" | "prime" | "composite" | "evenTimesEven" | "evenTimesOdd" | "oddTimesEven";
export type PartsClass = "perfect" | "superabundant" | "deficient";

export interface NumberClass {
  parity: ParityClass;
  /** 真因數和與本數比較;1 無真因數(Nicomachus:1 只係潛在完全數)→ null */
  parts: PartsClass | null;
  aliquotSum: number;
  /** 所屬形數:k 邊形數第 i 項 */
  figurate: { sides: number; index: number }[];
  /** 立方數:n = c³ */
  cube: number | null;
}

const isPrime = (n: number) => {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
};

function aliquot(n: number): number {
  if (n < 2) return 0;
  let s = 1;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) s += d + (d * d === n ? 0 : n / d);
  return s;
}

/** Nicomachus《算術入門》卷一:奇偶三類、質 / 合、盈 / 虧 / 完全,加形數(3–7 邊)與立方。 */
export function classifyNumber(n: number): NumberClass {
  let parity: ParityClass;
  if (n === 1) parity = "unit";
  else if (n % 2) parity = isPrime(n) ? "prime" : "composite";
  else {
    let k = 0, m = n;
    while (m % 2 === 0) { m /= 2; k++; }
    parity = m === 1 ? "evenTimesEven" : k === 1 ? "evenTimesOdd" : "oddTimesEven";
  }
  const s = aliquot(n);
  const parts: PartsClass | null = n === 1 ? null : s === n ? "perfect" : s > n ? "superabundant" : "deficient";
  const figurate: NumberClass["figurate"] = [];
  for (let sides = 3; sides <= 7; sides++) {
    // k 邊形數第 i 項 = ((k−2)i² − (k−4)i) / 2
    for (let i = 1; ; i++) {
      const v = ((sides - 2) * i * i - (sides - 4) * i) / 2;
      if (v === n) figurate.push({ sides, index: i });
      if (v >= n) break;
    }
  }
  const c = Math.round(Math.cbrt(n));
  return { parity, parts, aliquotSum: s, figurate, cube: c ** 3 === n ? c : null };
}

/* ───────────── 你的數 ───────────── */

export type LoreSource = "lifepath" | "kameaLine" | "kameaTotal" | "mayaKin" | "heluoHeaven" | "heluoEarth";

export interface NumberLoreItem {
  source: LoreSource;
  value: number;
  cls: NumberClass;
  /** Agrippa 數階(只得 1–10、12) */
  scale: { n: number; chapter: number; page: number | null; rows: AgrippaScaleRow[] } | null;
  /** 單一希伯來字母值等於此數者,連 Sefer Yetzirah 分類 */
  hebrew: { glyph: string; name: string; group: "mother" | "double" | "simple" } | null;
  gematria: GematriaTerm[];
}

export interface NumberLoreResult {
  items: NumberLoreItem[];
  /** gematria 基率:詞表不同數值 D 個、最大值 M;隨機 1–M 整數撞中約 D/M */
  baseRate: { distinct: number; max: number; p: number; eligible: number; expected: number; hits: number };
  steps: string[];
  tier: KnowledgeTier;
  cites: { scales: Cite; nicomachus: Cite; gematria: Cite; hebrew: Cite; seferYetzirah: Cite };
}

const groupOf = (glyph: string): "mother" | "double" | "simple" =>
  SEFER_YETZIRAH.mothers.items.some((m) => m.letter === glyph) ? "mother"
    : SEFER_YETZIRAH.doubles.letters.includes(glyph) ? "double" : "simple";

/** 盤中已算出的數:生命靈數、出生星期幻方行和 / 總和、瑪雅 Kin、河洛天數 / 地數。 */
export function castNumberLore(chart: ChartResult): NumberLoreResult {
  const { year, month, day } = chart.input;
  const lp = lifePath(year, month, day);
  const kamea = castKamea(year, month, day, []);
  const maya = castMaya(year, month, day);
  const heluo = castHeluo(chart.input);
  // Kin 1 = 1 Imix:數字 = (k−1) mod 13 + 1、日名序 = (k−1) mod 20
  let kin = 1;
  while (((kin - 1) % 13) + 1 !== maya.tzolkin.number || (kin - 1) % 20 !== maya.tzolkin.dayIndex) kin++;

  const sources: [LoreSource, number][] = [
    ["lifepath", lp.value], ["kameaLine", kamea.lineSum], ["kameaTotal", kamea.total],
    ["mayaKin", kin], ["heluoHeaven", heluo.heaven], ["heluoEarth", heluo.earth],
  ];
  const items = sources.map(([source, value]): NumberLoreItem => {
    const letter = HEBREW_LETTERS.find((l) => l.value === value);
    return {
      source, value, cls: classifyNumber(value),
      scale: AGRIPPA_SCALES.find((s) => s.n === value) ?? null,
      hebrew: letter ? { glyph: letter.glyph, name: letter.name, group: groupOf(letter.glyph) } : null,
      gematria: GEMATRIA_TERMS.filter((t) => t.value === value),
    };
  });

  const values = new Set(GEMATRIA_TERMS.map((t) => t.value));
  const max = Math.max(...values);
  const p = values.size / max;
  const eligible = items.filter((i) => i.value <= max).length;
  const hits = items.filter((i) => i.gematria.length).length;
  const round = (x: number) => Math.round(x * 1000) / 1000;
  const steps = [
    `生命靈數 ${lp.value};出生星期守護 ${kamea.planet},${kamea.order} 階幻方每行和 ${kamea.lineSum}、總和 ${kamea.total}。`,
    `瑪雅 Tzolk'in ${maya.tzolkin.number} ${maya.tzolkin.dayName} → Kin ${kin}(Kin 1 = 1 Imix,數字週期 13、日名週期 20)。`,
    `河洛理數:天數(單數和)${heluo.heaven}、地數(雙數和)${heluo.earth}(未減 25 / 30 之原數)。`,
    "分類依 Nicomachus《算術入門》卷一:偶數分偶偶(2ⁿ)、偶奇(2 × 奇數)、奇偶(2ᵏ × 奇數,k ≥ 2);奇數分質、合;再以真因數和定盈、虧、完全;形數以 k 邊形數公式 ((k−2)i² − (k−4)i) / 2 反查。",
    `gematria 基率:Fideler 詞表 ${GEMATRIA_TERMS.length} 詞共 ${values.size} 個不同數值,最大 ${max};隨機取 1–${max} 的整數撞中約 ${values.size}/${max} ≈ ${round(p)}。你有 ${eligible} 個數在範圍內,期望撞中約 ${round(eligible * p)} 個,實際 ${hits} 個。`,
    "詞表由 Fideler 挑選,本身已偏向 3、9、27、111、365、666、729、888 等「有意思」的數;撞中多寡不代表數值有特別意義。",
  ];
  return {
    items,
    baseRate: { distinct: values.size, max, p, eligible, expected: eligible * p, hits },
    steps,
    tier: "classical",
    cites: {
      scales: { work: "Three Books of Occult Philosophy", author: "Agrippa", year: 1651, locator: "II.4–14(J.F. 英譯)" },
      nicomachus: { work: "Introduction to Arithmetic", author: "Nicomachus", year: 1926, locator: "I(D'Ooge 英譯)" },
      gematria: { work: "Jesus Christ, Sun of God", author: "David Fideler", year: 1993 },
      hebrew: { work: "Three Books of Occult Philosophy", author: "Agrippa", year: 1651, locator: "字母數值表(Whitehead 1898 版,PDF 頁 258)" },
      seferYetzirah: { work: "Sepher Yetzirah", author: "W. W. Westcott 譯", year: 1893 },
    },
  };
}

/* ───────────── 出生對應 ───────────── */

export interface StarHit { star: string; bayer: string; n: number; alt: boolean; body: Planet | "Asc" | "MC"; starLon: number; orb: number }

export interface BirthLoreResult {
  lulu: { lunarMonth: number; branch: string; pipe: string; value: number; group: "upper" | "lower"; season: string; mode: string | null };
  zodiac: { sign: Sign; ruler: Planet; herb: string; fume: string; letter: { glyph: string; faculty: string; month: string } | null };
  dayPlanet: { planet: Planet; letter: { glyph: string; quality: string } | null };
  stars: { lons: { n: number; name: string; lon: number; alt: boolean }[]; hits: StarHit[]; orb: number; p: number; points: number; expected: number };
  steps: string[];
  cites: { lulu: Cite; zodiac: Cite; seferYetzirah: Cite; stars: Cite; orb: Cite };
}

const BRANCHES = "子丑寅卯辰巳午未申酉戌亥";
const RULERS: Planet[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
const norm = (d: number) => ((d % 360) + 360) % 360;
const sep = (a: number, b: number) => { const d = norm(a - b); return d > 180 ? 360 - d : d; };
const hms = (s: string) => { const [a, b, c] = s.split(" ").map(Number); return a! + b! / 60 + c! / 3600; };
const dmsSigned = (s: string) => { const neg = s.startsWith("-"); const v = hms(s.replace(/^[+-]/, "")); return neg ? -v : v; };

/** J2000 赤經赤緯 → 指定時刻真黃道黃經(含歲差章動;不計自行,兩百年內 Arcturus 約 0.1°)。 */
export function starLongitude(ra: string, dec: string, date: Date): number {
  const v = Astro.VectorFromSphere(new Astro.Spherical(dmsSigned(dec), hms(ra) * 15, 1), Astro.MakeTime(date));
  return Astro.Ecliptic(v).elon;
}

/** 弧聯集佔全圓比例(每點 ±orb)。 */
function arcCoverage(lons: number[], orb: number): number {
  const steps = 3600;
  let covered = 0;
  for (let i = 0; i < steps; i++) {
    const x = (i + 0.5) / 10;
    if (lons.some((l) => sep(x, l) <= orb)) covered++;
  }
  return covered / steps;
}

export function castBirthLore(chart: ChartResult, sky: EphemerisResult): BirthLoreResult {
  // 律呂:月支(節氣月)→ 夏曆月(寅 = 正月)→ 淮南子該月之律
  const branch = chart.bazi.fourPillars.month.zhi;
  const lunarMonth = ((BRANCHES.indexOf(branch) - 2 + 12) % 12) + 1;
  const pipe = LULU.huainanzi.pipes.find((p) => p.month === lunarMonth)!;
  const mode = Object.entries(LULU.huainanzi.modes).find(([, v]) => v === pipe.pipe)?.[0] ?? null;
  const lulu = {
    lunarMonth, branch, pipe: pipe.pipe, value: pipe.value,
    group: LULU.lushi.upper.includes(pipe.pipe) ? "upper" as const : "lower" as const,
    season: LULU.lushi.season[pipe.pipe]!, mode,
  };

  const sun = sky.planets.find((p) => p.planet === "Sun")!;
  const z = ZODIAC_CORRESPONDENCES.find((x) => x.sign === sun.sign)!;
  const simple = SEFER_YETZIRAH.simples.supplement.items.find((x) => x.sign === sun.sign);
  const zodiac = {
    sign: sun.sign, ruler: z.ruler, herb: z.herb, fume: z.fume,
    letter: simple ? { glyph: simple.letter, faculty: simple.faculty, month: simple.month } : null,
  };

  const { year, month, day } = chart.input;
  const planet = RULERS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]!;
  const dbl = SEFER_YETZIRAH.doubles.supplement.items.find((x) => x.planet === planet);
  const dayPlanet = { planet, letter: dbl ? { glyph: dbl.letter, quality: dbl.quality } : null };

  // 恆星:十五顆(第 8 顆另計 Polaris 異讀)黃經 vs 七曜、上升、天頂
  const when = new Date(sky.utc);
  const orb = BEHENIAN.orb.degrees;
  const lons: BirthLoreResult["stars"]["lons"] = [];
  for (const s of BEHENIAN.stars) {
    lons.push({ n: s.n, name: s.name, lon: starLongitude(s.ra, s.dec, when), alt: false });
    if (s.alt) lons.push({ n: s.n, name: s.alt.name, lon: starLongitude(s.alt.ra, s.alt.dec, when), alt: true });
  }
  const points: [StarHit["body"], number][] = sky.planets.map((p) => [p.planet, p.longitude]);
  if (sky.angles) points.push(["Asc", sky.angles.ascendant], ["MC", sky.angles.mc]);
  const hits: StarHit[] = [];
  for (const [body, lon] of points) {
    for (const s of lons) {
      const d = sep(lon, s.lon);
      if (d <= orb) {
        const star = BEHENIAN.stars.find((x) => x.n === s.n)!;
        hits.push({ star: s.name, bayer: s.alt ? star.alt!.bayer : star.bayer, n: s.n, alt: s.alt, body, starLon: s.lon, orb: Math.round(d * 100) / 100 });
      }
    }
  }
  const p = arcCoverage(lons.filter((s) => !s.alt).map((s) => s.lon), orb);
  const expected = points.length * p;
  const pct = (x: number) => `${Math.round(x * 1000) / 10}%`;

  const steps = [
    `月柱地支 ${branch} → 夏曆第 ${lunarMonth} 月 → 《淮南子·天文訓》${pipe.pipe},律數 ${pipe.value};《呂氏春秋》列${lulu.group === "upper" ? "上" : "下"}組,主${lulu.season}。`,
    `太陽在 ${sun.sign} ${sun.degree.toFixed(1)}° → Agrippa 卷一:守護 ${z.ruler}、草 ${z.herb}、薰香 ${z.fume}。`,
    simple ? `Sefer Yetzirah(Westcott 補表,近代)${sun.sign} 配單字母 ${simple.letter}(${simple.faculty},${simple.month} 月)。` : "",
    `出生日 ${year}-${month}-${day} 星期${"日一二三四五六"[RULERS.indexOf(planet)]},守護 ${planet}${dbl ? ` → Westcott 補表雙字母 ${dbl.letter}(${dbl.quality});其他傳統(如 Golden Dawn)配法不同` : ""}。`,
    `恆星黃經:J2000 赤經赤緯(Hipparcos)經歲差換算至 ${sky.utc}(真黃道),不計自行。`,
    `容許度 ${orb}°(維基百科所述傳統,近代整理);只比黃經,Vega、Capella、Alkaid 等黃緯高的星,在天球上實際距離遠大於黃經差。`,
    `第 8 顆:1651 英譯作 "Tail of the Lesser Bear"(Polaris),Hermes 傳統與現代整理作 Alkaid;兩者並列,不合併。`,
    `基率:十五顆星 ±${orb}° 合共覆蓋黃道約 ${pct(p)};${points.length} 個點(七曜${sky.angles ? "、上升、天頂" : ""})期望命中約 ${(Math.round(expected * 10) / 10)} 個,實際 ${hits.length} 個。`,
  ].filter(Boolean);

  return {
    lulu, zodiac, dayPlanet,
    stars: { lons, hits, orb, p, points: points.length, expected },
    steps,
    cites: {
      lulu: { work: "淮南子·天文訓", locator: "律數;並參《呂氏春秋·音律》" },
      zodiac: { work: "Three Books of Occult Philosophy", author: "Agrippa", year: 1651, locator: "I.31、32、44(守護、草、薰香)" },
      seferYetzirah: { work: "Sepher Yetzirah", author: "W. W. Westcott 譯", year: 1893, locator: "第四、五章補表(近代)" },
      stars: { work: "Validation of the new Hipparcos reduction", author: "F. van Leeuwen", year: 2007, locator: "A&A 474: 653;名稱依 Agrippa I.32" },
      orb: { work: "Behenian fixed star", author: "Wikipedia" },
    },
  };
}
