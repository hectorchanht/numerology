/**
 * 梅花易數·時間起卦引擎(純函數,零依賴)。
 *
 * 方法出處:邵雍《梅花易數》(宋代,公有領域)「以年、月、日、時起卦」之法:
 *   年數 = 年支數(子1、丑2 … 亥12)
 *   月數 = 農曆月份(1–12;閏月取本月之數)
 *   日數 = 農曆日期(1–30)
 *   時數 = 時支數(子1 … 亥12)
 *   上卦 = (年+月+日) % 8 (餘 0 取 8)
 *   下卦 = (年+月+日+時) % 8 (餘 0 取 8)
 *   動爻 = (年+月+日+時) % 6 (餘 0 取 6;由下往上數 1–6)
 * 先天八卦數:乾1、兌2、離3、震4、巽5、坎6、艮7、坤8。
 * 體用:動爻所在之卦為「用」,另一卦為「體」。
 *
 * 取數約定(本站,已在頁面說明):
 * - 年支取「農曆年」之地支(lunar-javascript),非立春換年。
 * - 時支由公曆小時經 hourToTimeIndex 映射(00–01 早子、23–24 晚子皆為子)。
 * 斷語為確定性體用五行生剋,不經 AI:
 *   用生體→大吉 / 體用比和→中吉 / 體剋用→小吉 / 體生用→小凶(洩氣) / 用剋體→大凶。
 */
import { Solar } from "lunar-javascript";
import { castYijing, type CastResult, type CoinLine, type TrigramKey } from "./yijing.js";
import { hourToTimeIndex, daysInMonth } from "./time.js";

/** 地支序數(子1 … 亥12) */
const BRANCH_NUM: Record<string, number> = {
  子: 1, 丑: 2, 寅: 3, 卯: 4, 辰: 5, 巳: 6,
  午: 7, 未: 8, 申: 9, 酉: 10, 戌: 11, 亥: 12,
};

/** 先天八卦數 */
const XIANTIAN_NUM: Record<TrigramKey, number> = {
  乾: 1, 兌: 2, 離: 3, 震: 4, 巽: 5, 坎: 6, 艮: 7, 坤: 8,
};
const NUM_TRIGRAM: Record<number, TrigramKey> = {
  1: "乾", 2: "兌", 3: "離", 4: "震", 5: "巽", 6: "坎", 7: "艮", 8: "坤",
};

/** 卦名 → 三爻 bits(由下而上) */
const TRIGRAM_BITS: Record<TrigramKey, number[]> = {
  乾: [1, 1, 1], 兌: [1, 1, 0], 離: [1, 0, 1], 震: [1, 0, 0],
  巽: [0, 1, 1], 坎: [0, 1, 0], 艮: [0, 0, 1], 坤: [0, 0, 0],
};

/** 卦之五行(乾兌金、離火、震巽木、坎水、艮坤土) */
const TRIGRAM_ELEMENT: Record<TrigramKey, "金" | "木" | "水" | "火" | "土"> = {
  乾: "金", 兌: "金", 離: "火", 震: "木", 巽: "木",
  坎: "水", 艮: "土", 坤: "土",
};

const SHENG: Record<string, string> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
const KE: Record<string, string> = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };

const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

export interface MeihuaNumbers {
  yearNum: number;
  monthNum: number;
  dayNum: number;
  hourNum: number;
  yearZhi: string;
  hourZhi: string;
  /** 農曆日期字串,如 "2024年12月2日"(閏月標註) */
  lunarLabel: string;
}

export type VerdictLevel = "大吉" | "中吉" | "小吉" | "小凶" | "大凶";

export interface MeihuaVerdict {
  level: VerdictLevel;
  /** 體用關係,如 "用生體" */
  relation: string;
  /** 一句話斷語(zht) */
  oneLiner: string;
}

export interface MeihuaResult {
  numbers: MeihuaNumbers;
  upper: TrigramKey;
  lower: TrigramKey;
  /** 動爻位置 1–6(由下而上);梅花時間卦恆有一動爻 */
  movingLine: number;
  /** 本卦文王卦序 1–64 */
  hexagram: number;
  /** 變卦卦序 */
  changed: number;
  /** 互卦卦序 */
  hu: number;
  /** 體(被動爻所在之外的卦) */
  ti: TrigramKey;
  /** 用(動爻所在之卦) */
  yong: TrigramKey;
  verdict: MeihuaVerdict;
  /** 六爻錢值(供 /api/yijing/interpret 用:動爻為 9/6,其餘 7/8) */
  lines: CoinLine[];
  /** 底層 castYijing 結果(供複用 bits 等) */
  cast: CastResult;
}

function modUp(n: number, m: number): number {
  const r = n % m;
  return r === 0 ? m : r;
}

function validateDateTime(year: number, month: number, day: number, hour: number): void {
  if (!Number.isInteger(year) || year < 1900 || year > 2100)
    throw new Error(`非法年份: ${year}(須為 1900–2100 整數)`);
  if (!Number.isInteger(month) || month < 1 || month > 12)
    throw new Error(`非法月份: ${month}`);
  const dim = daysInMonth(year, month);
  if (!Number.isInteger(day) || day < 1 || day > dim)
    throw new Error(`非法日期: ${day}(${year}年${month}月只有 ${dim} 天)`);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23)
    throw new Error(`非法小時: ${hour}(須為 0–23 整數)`);
}

/** 公曆日期時間 → 梅花四數(年/月/日時支數)。 */
export function timeNumbers(
  year: number,
  month: number,
  day: number,
  hour: number,
): MeihuaNumbers {
  validateDateTime(year, month, day, hour);
  const lunar = Solar.fromYmdHms(year, month, day, hour, 0, 0).getLunar();
  const yearZhi = lunar.getYearZhi();
  const monthNum = Math.abs(lunar.getMonth()); // 閏月取本月之數
  const dayNum = lunar.getDay();
  const ti = hourToTimeIndex(hour);
  const hourZhi = ti === 12 ? "子" : BRANCHES[ti]!;
  const leapMark = lunar.getMonth() < 0 ? "閏" : "";
  return {
    yearNum: BRANCH_NUM[yearZhi]!,
    monthNum,
    dayNum,
    hourNum: BRANCH_NUM[hourZhi]!,
    yearZhi,
    hourZhi,
    lunarLabel: `${lunar.getYear()}年${leapMark}${monthNum}月${dayNum}日`,
  };
}

/** 四數 → 上卦/下卦/動爻(純算術,供測試直接餵數)。 */
export function guaFromNumbers(n: MeihuaNumbers): {
  upper: TrigramKey;
  lower: TrigramKey;
  movingLine: number;
} {
  const upper = NUM_TRIGRAM[modUp(n.yearNum + n.monthNum + n.dayNum, 8)]!;
  const lower = NUM_TRIGRAM[modUp(n.yearNum + n.monthNum + n.dayNum + n.hourNum, 8)]!;
  const movingLine = modUp(n.yearNum + n.monthNum + n.dayNum + n.hourNum, 6);
  return { upper, lower, movingLine };
}

function judge(tiEl: string, yongEl: string, ti: TrigramKey, yong: TrigramKey): MeihuaVerdict {
  if (SHENG[yongEl] === tiEl)
    return {
      level: "大吉",
      relation: "用生體",
      oneLiner: `用生體——${yong}(${yongEl})生${ti}(${tiEl})，外來生助，大吉。`,
    };
  if (tiEl === yongEl)
    return {
      level: "中吉",
      relation: "體用比和",
      oneLiner: `體用比和——同屬${tiEl}，同氣相求，中吉。`,
    };
  if (KE[tiEl] === yongEl)
    return {
      level: "小吉",
      relation: "體剋用",
      oneLiner: `體剋用——${ti}(${tiEl})剋${yong}(${yongEl})，我能制人，小吉。`,
    };
  if (SHENG[tiEl] === yongEl)
    return {
      level: "小凶",
      relation: "體生用",
      oneLiner: `體生用——${ti}(${tiEl})生${yong}(${yongEl})，洩氣付出，小凶。`,
    };
  return {
    level: "大凶",
    relation: "用剋體",
    oneLiner: `用剋體——${yong}(${yongEl})剋${ti}(${tiEl})，受制於人，大凶。`,
  };
}

/** 梅花時間起卦:公曆日期時間 → 完整卦象 + 體用斷。 */
export function castMeihua(
  year: number,
  month: number,
  day: number,
  hour: number,
): MeihuaResult {
  const numbers = timeNumbers(year, month, day, hour);
  const { upper, lower, movingLine } = guaFromNumbers(numbers);

  // 以 bits 重建六爻(下卦在下),複用 castYijing 求卦序/互卦/變卦
  const bits = [...TRIGRAM_BITS[lower]!, ...TRIGRAM_BITS[upper]!];
  const lines = bits.map((b, i) =>
    i + 1 === movingLine ? (b === 1 ? 9 : 6) : b === 1 ? 7 : 8,
  ) as CoinLine[];
  const cast = castYijing(lines);

  const yong = movingLine <= 3 ? lower : upper;
  const ti = movingLine <= 3 ? upper : lower;
  const verdict = judge(TRIGRAM_ELEMENT[ti]!, TRIGRAM_ELEMENT[yong]!, ti, yong);

  return {
    numbers,
    upper,
    lower,
    movingLine,
    hexagram: cast.hexagram,
    changed: cast.changed ?? cast.hexagram,
    hu: cast.hu,
    ti,
    yong,
    verdict,
    lines,
    cast,
  };
}
