import { QIZHENG_MANSIONS, QIZHENG_SEVEN, QIZHENG_YU, QIZHENG_ZIQI } from "@numerology/knowledge";
import { castEphemeris } from "./ephemeris.js";
import type { BirthInput } from "./types.js";

export interface QizhengBody {
  id: string;
  name: string;
  kind: "政" | "餘";
  /** 回歸黃經(度,[0,360)) */
  longitude: number;
  /** 現代距星宿度 */
  mansion: { name: string; degree: number };
  /** 古宿度(古度單位,周天 365);參宿範圍包觜,唔會出「觜」 */
  ancient: { name: string; degree: number };
  retrograde?: boolean;
}

export interface QizhengResult {
  utc: string;
  bodies: QizhengBody[];
  variants: string[];
  steps: string[];
  tier: "classical";
  cite: { work: string; locator: string };
}

// 先 % 再補 360:避免 (x+360)%360 浮點誤差令正好落喺距星嘅點掉去上一宿;差 < 1e-9° 當 0
const norm = (d: number) => { const r = d % 360; const n = r < 0 ? r + 360 : r; return n > 360 - 1e-9 ? 0 : n; };
const dms = (d: number) => `${Math.floor(d)}°${String(Math.floor((d % 1) * 60)).padStart(2, "0")}′`;
const J2000_MS = Date.UTC(2000, 0, 1, 12);
const DAY = 86400000;
/** 一般歲差 50.29″/年(黃經)。ponytail: 當全部距星同速,忽略黃緯與黃道移動項(1900–2100 誤差約 0.01° 級);要更準就改用 astronomy-engine Rotation_EQJ_ECT 轉距星赤道座標。 */
const PRECESSION_DEG_PER_YEAR = 50.29 / 3600;

/** 某黃經(回歸)於時刻 ms(UTC 毫秒)所落現代宿同古宿;距星歲差後為宿起點 */
export function qizhengMansionAt(longitude: number, ms: number) {
  const prec = (PRECESSION_DEG_PER_YEAR * (ms - J2000_MS)) / (DAY * 365.25);
  const starts = QIZHENG_MANSIONS.map((m) => ({ name: m.name, lon: norm(m.lonJ2000 + prec) }));
  let best = starts[0]!, bd = 360;
  for (const s of starts) { const d = norm(longitude - s.lon); if (d < bd) { bd = d; best = s; } }
  // 古宿:由角宿起累計古度(現代度 × 365/360);觜 0 度,範圍併入參
  const x = Math.min(norm(longitude - starts[0]!.lon) * 365 / 360, 365 - 1e-9);
  const real = QIZHENG_MANSIONS.filter((m) => m.ancientDeg > 0);
  let acc = 0, anc = { name: real[real.length - 1]!.name, degree: 0 };
  for (const m of real) {
    if (x < acc + m.ancientDeg) { anc = { name: m.name, degree: x - acc }; break; }
    acc += m.ancientDeg;
  }
  return { modern: { name: best.name, degree: bd }, ancient: anc };
}

export function castQizheng(input: BirthInput): QizhengResult {
  const eph = castEphemeris(input);
  const ms = Date.parse(eph.utc);
  const T = (ms - J2000_MS) / (DAY * 36525);
  const jd = ms / DAY + 2440587.5;

  const at = (lon: number) => qizhengMansionAt(lon, ms);
  const modern = (lon: number) => at(lon).modern;
  const ancient = (lon: number) => at(lon).ancient;

  const raw: { id: string; name: string; kind: "政" | "餘"; lon: number; retro?: boolean }[] = [
    ...QIZHENG_SEVEN.map((s) => {
      const p = eph.planets.find((q) => q.planet === s.body)!;
      return { id: s.body, name: s.name, kind: "政" as const, lon: p.longitude, retro: p.retrograde };
    }),
  ];
  const omega = norm(125.04452 - 1934.136261 * T);
  const perigee = norm(83.3532465 + 4069.0137287 * T);
  const yuLon: Record<string, [number, boolean]> = {
    luohou: [omega, true],
    jidu: [norm(omega + 180), true],
    yuebei: [norm(perigee + 180), false],
    ziqi: [norm(QIZHENG_ZIQI.lonAtEpoch + QIZHENG_ZIQI.degPerDay * (jd - QIZHENG_ZIQI.epochJd)), false],
  };
  for (const y of QIZHENG_YU) raw.push({ id: y.id, name: y.name, kind: "餘", lon: yuLon[y.id]![0], retro: yuLon[y.id]![1] });

  const bodies = raw.map((r): QizhengBody => ({
    id: r.id, name: r.name, kind: r.kind, longitude: r.lon,
    mansion: modern(r.lon), ancient: ancient(r.lon), retrograde: r.retro,
  }));

  const steps = [
    `七政黃經取 castEphemeris(${eph.utc.slice(0, 16)}Z,東八區、未計夏令時),回歸黃道。`,
    `羅睺 = 平均升交點 Ω = 125.04452° − 1934.136261°·T(T = ${T.toFixed(5)} 世紀)= ${dms(omega)};計都 = 羅睺 + 180°。`,
    `月孛 = 平均遠地點 = 平均近地點 + 180°;紫氣按《推步捷例》平行 ${QIZHENG_ZIQI.degPerDay}°/日由元起算(流派公式,無實象)。`,
    `距星黃經由 J2000 加歲差 ${((PRECESSION_DEG_PER_YEAR * (ms - J2000_MS)) / (DAY * 365.25)).toFixed(4)}°(50.29″/年)推到出生日;某點宿 = 黃經 ≥ 該宿距星而 < 下一宿距星。`,
    "古宿度以角宿距星為起點,現代度 × 365 / 360 化古度,按《六壬大全》卷十一宿度表累計;觜附參,參宿範圍包觜。",
    ...bodies.map((b) => `${b.name} ${dms(b.longitude)}:現代 ${b.mansion.name}宿 ${dms(b.mansion.degree)},古度 ${b.ancient.name}宿 ${dms(b.ancient.degree)}${b.retrograde ? "(逆行)" : ""}。`),
  ];

  return {
    utc: eph.utc, bodies,
    variants: [
      "羅計分歧:《張果星宗》《清史稿》以升交為羅睺、降交為計都;《推步捷例》以正交為計都,與此對調。",
      "古宿度表(《六壬大全》卷十一)各曆初度取 1 度為概數;《星學大成》度歌讀法見知識表 variants。",
    ],
    steps, tier: "classical",
    cite: { work: "六壬大全(四庫全書本)/星學大成/張果星宗/推步捷例/清史稿", locator: "六壬大全卷十一;清史稿卷四十五〈時憲志一〉" },
  };
}
