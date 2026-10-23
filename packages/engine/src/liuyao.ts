/**
 * 六爻納甲裝卦引擎(純函數,零依賴)。
 *
 * 古典依據(公有領域):
 * - 納甲歌:「乾金甲子外壬午,兌金丁巳外丁亥,離火己卯外己酉,
 *   震木庚子外庚午,巽木辛丑外辛未,坎水戊寅外戊申,艮土丙辰外丙戌,
 *   坤土乙未外癸丑」(內卦初二三爻 / 外卦四五上爻)
 * - 京房八宮:每宮八卦(八純→一世→二世→三世→四世→五世→遊魂→歸魂),
 *   世應位置按卦型定;卦宮五行即本宮卦五行(乾兌金/離火/震巽木/坎水/艮坤土)
 * - 六獸歌:「甲乙起青龍,丙丁起朱雀,戊日起勾陳,己日起螣蛇,
 *   庚辛起白虎,壬癸起玄武」(初爻起,向上排)
 * - 旬空:日干支所在甲X旬,未涵蓋的兩支為空
 *
 * 表格曾與 kentang2017/ichingshifa (MIT) 的 decode_gua 邏輯交叉核對;
 * 其 data.pkl 為不透明二進制,未直接引用,所有表均按上列古典規則手寫。
 */

import { castBazi } from "./bazi.js";
import { trigramOfBits, type TrigramKey } from "./yijing.js";

/** 爻錢值:6 老陰(動) / 7 少陽 / 8 少陰 / 9 老陽(動) */
export type YaoValue = 6 | 7 | 8 | 9;

type Wuxing = "金" | "木" | "水" | "火" | "土";
export type Qin = "兄弟" | "子孫" | "妻財" | "官鬼" | "父母";

const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

const BRANCH_WUXING: Record<string, Wuxing> = {
  子: "水", 丑: "土", 寅: "木", 卯: "木", 辰: "土", 巳: "火",
  午: "火", 未: "土", 申: "金", 酉: "金", 戌: "土", 亥: "水",
};

const TRIGRAM_WUXING: Record<TrigramKey, Wuxing> = {
  乾: "金", 兌: "金", 離: "火", 震: "木",
  巽: "木", 坎: "水", 艮: "土", 坤: "土",
};

const TRIGRAM_BITS: Record<TrigramKey, [number, number, number]> = {
  乾: [1, 1, 1], 兌: [1, 1, 0], 離: [1, 0, 1], 震: [1, 0, 0],
  巽: [0, 1, 1], 坎: [0, 1, 0], 艮: [0, 0, 1], 坤: [0, 0, 0],
};
const ALL_TRIGRAMS = Object.keys(TRIGRAM_BITS) as TrigramKey[];

/* 納甲表:每卦 { 內卦天干 + 初二三爻地支, 外卦天干 + 四五上爻地支 } */
const NAJIA: Record<TrigramKey, { inner: [string, string[]]; outer: [string, string[]] }> = {
  乾: { inner: ["甲", ["子", "寅", "辰"]], outer: ["壬", ["午", "申", "戌"]] },
  兌: { inner: ["丁", ["巳", "卯", "丑"]], outer: ["丁", ["亥", "酉", "未"]] },
  離: { inner: ["己", ["卯", "丑", "亥"]], outer: ["己", ["酉", "未", "巳"]] },
  震: { inner: ["庚", ["子", "寅", "辰"]], outer: ["庚", ["午", "申", "戌"]] },
  巽: { inner: ["辛", ["丑", "亥", "酉"]], outer: ["辛", ["未", "巳", "卯"]] },
  坎: { inner: ["戊", ["寅", "辰", "午"]], outer: ["戊", ["申", "戌", "子"]] },
  艮: { inner: ["丙", ["辰", "午", "申"]], outer: ["丙", ["戌", "子", "寅"]] },
  坤: { inner: ["乙", ["未", "巳", "卯"]], outer: ["癸", ["丑", "亥", "酉"]] },
};

const SHENG: Record<Wuxing, Wuxing> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
const KE: Record<Wuxing, Wuxing> = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };

/** 六親:以卦宮五行為「我」。 */
export function qinOf(palaceWuxing: Wuxing, yaoWuxing: Wuxing): Qin {
  if (yaoWuxing === palaceWuxing) return "兄弟";
  if (SHENG[yaoWuxing] === palaceWuxing) return "父母"; // 爻生宮,生我者
  if (SHENG[palaceWuxing] === yaoWuxing) return "子孫"; // 宮生爻,我生者
  if (KE[yaoWuxing] === palaceWuxing) return "官鬼"; // 爻剋宮,剋我者
  return "妻財"; // 宮剋爻,我剋者
}

const BEASTS = ["青龍", "朱雀", "勾陳", "螣蛇", "白虎", "玄武"];
/** 六獸歌起點:日干 → 初爻之獸的索引 */
const BEAST_START: Record<string, number> = {
  甲: 0, 乙: 0, 丙: 1, 丁: 1, 戊: 2, 己: 3, 庚: 4, 辛: 4, 壬: 5, 癸: 5,
};

/** 六獸:初爻起,按日起點向上排 */
export function beastOf(dayStem: string, position: number): string {
  const s = BEAST_START[dayStem];
  if (s === undefined || position < 1 || position > 6) throw new Error(`非法六獸參數: ${dayStem}${position}`);
  return BEASTS[(s + position - 1) % 6] as string;
}

/** 旬空:日干支所在旬未涵蓋的兩支 */
export function xunKong(dayStem: string, dayBranch: string): [string, string] {
  const g = STEMS.indexOf(dayStem);
  const z = BRANCHES.indexOf(dayBranch);
  if (g < 0 || z < 0) throw new Error(`非法日干支: ${dayStem}${dayBranch}`);
  const start = (((z - g) % 12) + 12) % 12;
  const covered = new Set(Array.from({ length: 10 }, (_, i) => (start + i) % 12));
  const kong = BRANCHES.filter((_, i) => !covered.has(i));
  if (kong.length !== 2) throw new Error("xunKong: 內部錯誤");
  return [kong[0] as string, kong[1] as string];
}

/** 地支相沖:差 6 */
export function chong(a: string, b: string): boolean {
  const x = BRANCHES.indexOf(a);
  const y = BRANCHES.indexOf(b);
  return x >= 0 && y >= 0 && Math.abs(x - y) === 6;
}

export interface PalaceInfo {
  palace: TrigramKey;
  palaceWuxing: Wuxing;
  /** 世爻位置 1–6 */
  shi: number;
  /** 應爻位置 1–6 */
  ying: number;
  /** 卦型:八純/一世/二世/三世/四世/五世/遊魂/歸魂 */
  shape: string;
}

const PALACE_MAP: Map<string, PalaceInfo> = (() => {
  const map = new Map<string, PalaceInfo>();
  const defs: { flips: number[]; shi: number; ying: number; shape: string }[] = [
    { flips: [], shi: 6, ying: 3, shape: "八純" },
    { flips: [1], shi: 1, ying: 4, shape: "一世" },
    { flips: [1, 2], shi: 2, ying: 5, shape: "二世" },
    { flips: [1, 2, 3], shi: 3, ying: 6, shape: "三世" },
    { flips: [1, 2, 3, 4], shi: 4, ying: 1, shape: "四世" },
    { flips: [1, 2, 3, 4, 5], shi: 5, ying: 2, shape: "五世" },
    { flips: [1, 2, 3, 5], shi: 4, ying: 1, shape: "遊魂" }, // 五世卦四爻再變
  ];
  for (const p of ALL_TRIGRAMS) {
    const base = [...TRIGRAM_BITS[p], ...TRIGRAM_BITS[p]];
    const info = (shape: string, shi: number, ying: number): PalaceInfo => ({
      palace: p, palaceWuxing: TRIGRAM_WUXING[p], shi, ying, shape,
    });
    for (const d of defs) {
      const bits = base.map((b, i) => (d.flips.includes(i + 1) ? 1 - b : b));
      map.set(bits.join(""), info(d.shape, d.shi, d.ying));
    }
    // 歸魂:遊魂卦內卦復原為本宮卦,世三爻應上爻
    const youhun = base.map((b, i) => ([1, 2, 3, 5].includes(i + 1) ? 1 - b : b));
    const guihun = [...TRIGRAM_BITS[p], ...youhun.slice(3)];
    map.set(guihun.join(""), info("歸魂", 3, 6));
  }
  return map;
})();

/** 查卦宮/世應/卦型;bits 由下而上(1=陽) */
export function palaceOf(bits: readonly number[]): PalaceInfo {
  const hit = PALACE_MAP.get(bits.map((b) => (b ? 1 : 0)).join(""));
  if (!hit) throw new Error("palaceOf: 非法六爻");
  return hit;
}

export interface LiuyaoYao {
  /** 爻位 1–6(由下而上) */
  position: number;
  value: YaoValue;
  yinYang: "陰" | "陽";
  moving: boolean;
  stem: string;
  branch: string;
  ganzhi: string;
  wuxing: Wuxing;
  /** 六親 */
  qin: Qin;
  /** 世/應/"" */
  shiYing: "世" | "應" | "";
  /** 六獸 */
  beast: string;
  xunKong: boolean;
  yuePo: boolean;
  riPo: boolean;
}

export interface LiuyaoResult {
  /** 六爻陰陽 bits(由下而上,1=陽) */
  bits: number[];
  lowerTrigram: TrigramKey;
  upperTrigram: TrigramKey;
  palace: TrigramKey;
  palaceWuxing: Wuxing;
  shape: string;
  shi: number;
  ying: number;
  dayGanzhi: string;
  monthBranch: string;
  kong: [string, string];
  /** 由下而上 */
  yaos: LiuyaoYao[];
}

function assertLine(v: number): asserts v is YaoValue {
  if (v !== 6 && v !== 7 && v !== 8 && v !== 9) throw new Error(`非法爻值 ${v}(須為 6/7/8/9)`);
}

/**
 * 六爻納甲裝卦。
 * @param lines 六爻錢值,由下而上
 * @param dayStem 日干, dayBranch 日支(日辰)
 * @param monthBranch 月建地支(按節氣)
 */
export function paigua(
  lines: readonly [number, number, number, number, number, number],
  dayStem: string,
  dayBranch: string,
  monthBranch: string,
): LiuyaoResult {
  if (lines.length !== 6) throw new Error("paigua: 須傳六爻");
  lines.forEach(assertLine);
  if (!STEMS.includes(dayStem) || !BRANCHES.includes(dayBranch) || !BRANCHES.includes(monthBranch)) {
    throw new Error(`非法干支: ${dayStem}${dayBranch} / 月${monthBranch}`);
  }
  const bits = lines.map((raw) => {
    assertLine(raw);
    return raw === 7 || raw === 9 ? 1 : 0;
  });
  const lower = trigramOfBits(bits.slice(0, 3));
  const upper = trigramOfBits(bits.slice(3, 6));
  const pal = palaceOf(bits);
  const kong = xunKong(dayStem, dayBranch);

  const yaos: LiuyaoYao[] = lines.map((raw, i) => {
    assertLine(raw);
    const v: YaoValue = raw;
    const pos = i + 1;
    const tbl = i < 3 ? NAJIA[lower].inner : NAJIA[upper].outer;
    const stem = tbl[0];
    const branch = tbl[1][i % 3] as string;
    const wuxing = BRANCH_WUXING[branch] as Wuxing;
    return {
      position: pos,
      value: v,
      yinYang: bits[i] ? "陽" : "陰",
      moving: v === 6 || v === 9,
      stem,
      branch,
      ganzhi: stem + branch,
      wuxing,
      qin: qinOf(pal.palaceWuxing, wuxing),
      shiYing: pos === pal.shi ? "世" : pos === pal.ying ? "應" : "",
      beast: beastOf(dayStem, pos),
      xunKong: kong.includes(branch),
      yuePo: chong(branch, monthBranch),
      riPo: chong(branch, dayBranch),
    };
  });

  return {
    bits,
    lowerTrigram: lower,
    upperTrigram: upper,
    palace: pal.palace,
    palaceWuxing: pal.palaceWuxing,
    shape: pal.shape,
    shi: pal.shi,
    ying: pal.ying,
    dayGanzhi: dayStem + dayBranch,
    monthBranch,
    kong,
    yaos,
  };
}

/**
 * 取某公曆日的 日干支(日辰) 與 月建地支(按節氣,如正月建寅)。
 * 複用 bazi 的節氣曆法(已測試),中午 12 點起盤以避開子時換日邊界。
 */
export function ganzhiForDate(
  year: number,
  month: number,
  day: number,
): { dayStem: string; dayBranch: string; monthBranch: string } {
  const chart = castBazi({ year, month, day, hour: 12, minute: 0, gender: "男" });
  return {
    dayStem: chart.fourPillars.day.gan,
    dayBranch: chart.fourPillars.day.zhi,
    monthBranch: chart.fourPillars.month.zhi,
  };
}
