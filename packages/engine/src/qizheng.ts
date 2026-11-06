import { QIZHENG_GONG, QIZHENG_MANSIONS, QIZHENG_SEVEN, QIZHENG_YU, QIZHENG_ZIQI } from "@numerology/knowledge";
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
  /** 所落宮(地支 + 十二次名),按《星學大成》過宮度於古宿度上定 */
  gong: { zhi: string; ci: string };
  /** 所落宮之十二宮名(命宮、財帛…) */
  house: string;
  retrograde?: boolean;
}

export interface QizhengResult {
  utc: string;
  bodies: QizhengBody[];
  /** 命宮:太陽所在宮加生時地支,數至卯 */
  minggong: { zhi: string; ci: string; hourZhi: string; sunZhi: string };
  /** 十二宮:由命宮起逆地支次序排 */
  houses: { name: string; zhi: string; ci: string }[];
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

const ZHI = "子丑寅卯辰巳午未申酉戌亥";
const ANC_START: Record<string, number> = {};
{ let acc = 0; for (const m of QIZHENG_MANSIONS) { ANC_START[m.name] = acc; acc += m.ancientDeg; } }
/** 過宮界按周天古度位置排序;位置 < 最小界即屬最末界之宮(辰,跨角宿) */
const GONG_AT = QIZHENG_GONG.boundaries.map((b) => ({ zhi: b.zhi, ci: b.ci, pos: ANC_START[b.xiu]! + b.deg })).sort((a, b) => a.pos - b.pos);
const gongOf = (x: number) => { let g = GONG_AT[GONG_AT.length - 1]!; for (const b of GONG_AT) if (x >= b.pos) g = b; return { zhi: g.zhi, ci: g.ci }; };
const ciOf = (zhi: string) => GONG_AT.find((g) => g.zhi === zhi)!.ci;

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
  return { modern: { name: best.name, degree: bd }, ancient: anc, gong: gongOf(x) };
}

export function castQizheng(input: BirthInput): QizhengResult {
  const eph = castEphemeris(input);
  const ms = Date.parse(eph.utc);
  const T = (ms - J2000_MS) / (DAY * 36525);
  const jd = ms / DAY + 2440587.5;

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

  const placed = raw.map((r) => ({ r, at: qizhengMansionAt(r.lon, ms) }));
  // 命宮:日宮加生時(鐘面時支),數至卯 → 命宮支序 = 日宮 + 卯(3) − 時支
  const sunZhi = placed[0]!.at.gong.zhi;
  const hourZhi = ZHI[Math.floor((input.hour + 1) / 2) % 12]!;
  const mi = (ZHI.indexOf(sunZhi) + 3 - ZHI.indexOf(hourZhi) + 12) % 12;
  const houses = QIZHENG_GONG.houses.map((name, k) => { const zhi = ZHI[(mi - k + 12) % 12]!; return { name, zhi, ci: ciOf(zhi) }; });
  const minggong = { zhi: houses[0]!.zhi, ci: houses[0]!.ci, hourZhi, sunZhi };

  const bodies = placed.map(({ r, at }): QizhengBody => ({
    id: r.id, name: r.name, kind: r.kind, longitude: r.lon,
    mansion: at.modern, ancient: at.ancient, gong: at.gong,
    house: houses.find((h) => h.zhi === at.gong.zhi)!.name, retrograde: r.retro,
  }));

  const steps = [
    `七政黃經取 castEphemeris(${eph.utc.slice(0, 16)}Z,東八區、未計夏令時),回歸黃道。`,
    `羅睺 = 平均升交點 Ω = 125.04452° − 1934.136261°·T(T = ${T.toFixed(5)} 世紀)= ${dms(omega)};計都 = 羅睺 + 180°。`,
    `月孛 = 平均遠地點 = 平均近地點 + 180°;紫氣按《推步捷例》平行 ${QIZHENG_ZIQI.degPerDay}°/日由元起算(流派公式,無實象)。`,
    `距星黃經由 J2000 加歲差 ${((PRECESSION_DEG_PER_YEAR * (ms - J2000_MS)) / (DAY * 365.25)).toFixed(4)}°(50.29″/年)推到出生日;某點宿 = 黃經 ≥ 該宿距星而 < 下一宿距星。`,
    "古宿度以角宿距星為起點,現代度 × 365 / 360 化古度,按《六壬大全》卷十一宿度表累計;觜附參,參宿範圍包觜。",
    "十二宮按《星學大成》卷一〈約二十八宿過宫度數歌〉過宮度(氐一過卯…軫九辰)於古宿度上分界;次名取《晉書·天文志》。",
    `命宮:太陽在${sunZhi}宮,加生時${hourZhi}(鐘面時),數至卯 → 命宮在${minggong.zhi}(${minggong.ci});十二宮由命宮逆排(《張果星宗》《星學大成》)。`,
    ...bodies.map((b) => `${b.name} ${dms(b.longitude)}:現代 ${b.mansion.name}宿 ${dms(b.mansion.degree)},古度 ${b.ancient.name}宿 ${dms(b.ancient.degree)},${b.gong.zhi}宮${b.gong.ci}(${b.house})${b.retrograde ? "(逆行)" : ""}。`),
  ];

  return {
    utc: eph.utc, bodies, minggong, houses,
    variants: [
      "羅計分歧:《張果星宗》《清史稿》以升交為羅睺、降交為計都;《推步捷例》以正交為計都,與此對調。",
      "古宿度表(《六壬大全》卷十一)各曆初度取 1 度為概數;《星學大成》度歌讀法見知識表 variants。",
      "過宮度:《張果星宗》卷一〈度数所在〉斗、女、張、軫四界比《星學大成》各晚 1 度;命宮用鐘面時支,未計真太陽時,只定到宮。",
    ],
    steps, tier: "classical",
    cite: { work: "六壬大全(四庫全書本)/星學大成/張果星宗/推步捷例/清史稿", locator: "六壬大全卷十一;星學大成卷一、卷四;張果星宗卷一、卷二、卷八;清史稿卷四十五〈時憲志一〉" },
  };
}
