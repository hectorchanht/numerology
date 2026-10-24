import { Solar } from "lunar-javascript";

/**
 * 奇門遁甲·時家轉盤(拆補定局)引擎。純函數,確定性,零 AI。
 *
 * 口徑:
 * - 定局:節氣(冬至~夏至陽遁/夏至~冬至陰遁) × 上中下三元(拆補:節氣日干
 *   甲己丁壬→上元,乙庚戊癸→中元,丙辛→下元;每5天進一元)。
 * - 地盤三奇六儀:陽遁自局數宮起戊順布九宮,陰遁逆布。
 * - 天盤九星:值符(旬首儀落宮之本宮星)加時干宮,陽順陰逆轉布(天禽寄坤二宮)。
 * - 八門:值使(旬首宮之本宮門,中宮寄死門)加時干宮,陽順陰逆轉布(跳過中宮)。
 * - 格局:星伏吟/門伏吟/星反吟/門反吟/空亡/擊刑/入墓/門迫/馬星;五不遇時另行判斷。
 * - 八神 v1 從略(轉盤派口徑待核實,不臆測)。
 *
 * 驗證向量:2026-10-11 22:00(戊午日癸亥時)→寒露中元陰遁9局,
 * 旬首甲寅(空亡子丑),值符天輔/值使杜門,地盤離9戊…坎1乙,
 * 天盤巽4天輔/癸、坤2天芮+天禽/丙+壬…,八門巽4杜…乾6開,
 * 巽4星伏吟+門伏吟+擊刑+入墓+馬星(見測試)。
 */

export interface QimenInput {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute?: number;
}

export interface QimenPalace {
  /** 九宮號 1-9 */
  gong: number;
  gongName: string;
  /** 宮地支(空亡/入墓用) */
  zhi: string;
  diPan: string;
  tianPan: string;
  star: string;
  men: string;
  patterns: string[];
  maXing: boolean;
  kongWang: boolean;
}

export interface QimenResult {
  input: QimenInput;
  dayGanZhi: string;
  timeGanZhi: string;
  jieqi: string;
  yuan: "上元" | "中元" | "下元";
  dun: "陽遁" | "陰遁";
  ju: number;
  xunShou: string;
  xunKong: string;
  zhiFu: string;
  zhiShi: string;
  /** 按宮號 1-9 排序 */
  palaces: QimenPalace[];
}

const GONG_NAME: Record<number, string> = {
  1: "坎", 2: "坤", 3: "震", 4: "巽", 5: "中", 6: "乾", 7: "兌", 8: "艮", 9: "離",
};
const GONG_ZHI: Record<number, string> = {
  1: "子", 2: "未申", 3: "卯", 4: "辰巳", 5: "", 6: "戌亥", 7: "酉", 8: "丑寅", 9: "午",
};
const GONG_WUXING: Record<number, string> = {
  1: "水", 2: "土", 3: "木", 4: "木", 5: "土", 6: "金", 7: "金", 8: "土", 9: "火",
};
/** 地盤布干順序(三奇六儀) */
const YI6 = ["戊", "己", "庚", "辛", "壬", "癸", "丁", "丙", "乙"];
/** 九星本宮 */
const STAR_HOME: Record<string, number> = {
  天蓬: 1, 天芮: 2, 天沖: 3, 天輔: 4, 天禽: 5, 天心: 6, 天柱: 7, 天任: 8, 天英: 9,
};
/** 九星轉布序(陽遁順) */
const STAR_SHUN = ["天蓬", "天芮", "天沖", "天輔", "天禽", "天心", "天柱", "天任", "天英"];
/** 八門本宮 */
const MEN_HOME: Record<string, number> = {
  休門: 1, 死門: 2, 傷門: 3, 杜門: 4, 開門: 6, 驚門: 7, 生門: 8, 景門: 9,
};
/** 八門轉布序(陽遁順) */
const MEN_SHUN = ["休門", "死門", "傷門", "杜門", "開門", "驚門", "生門", "景門"];
const MEN_WUXING: Record<string, string> = {
  休門: "水", 死門: "土", 傷門: "木", 杜門: "木", 開門: "金", 驚門: "金", 生門: "土", 景門: "火",
};
const XUN_SHOU = ["甲子", "甲戌", "甲申", "甲午", "甲辰", "甲寅"];
const XUN_YI = ["戊", "己", "庚", "辛", "壬", "癸"];
const XUN_KONG = ["戌亥", "申酉", "午未", "辰巳", "寅卯", "子丑"];
/** 陽遁節氣(冬至~芒種) */
const YANG_JIEQI = new Set([
  "冬至", "小寒", "大寒", "立春", "雨水", "驚蟄",
  "春分", "清明", "穀雨", "立夏", "小滿", "芒種",
]);
/** 節氣上中下三元局數表:[上元,中元,下元] */
const JU_TABLE: Record<string, [number, number, number]> = {
  立春: [8, 5, 2], 雨水: [9, 6, 3], 驚蟄: [1, 7, 4], 春分: [3, 9, 6],
  清明: [4, 1, 7], 穀雨: [5, 2, 8], 立夏: [4, 1, 7], 小滿: [5, 2, 8],
  芒種: [6, 3, 9], 夏至: [9, 3, 6], 小暑: [8, 2, 5], 大暑: [7, 1, 4],
  立秋: [2, 8, 5], 處暑: [1, 7, 4], 白露: [9, 6, 3], 秋分: [7, 4, 1],
  寒露: [6, 9, 3], 霜降: [5, 2, 8], 立冬: [6, 9, 3], 小雪: [5, 2, 8],
  大雪: [4, 1, 7], 冬至: [1, 7, 4], 小寒: [2, 8, 5], 大寒: [3, 9, 6],
};
/** 節氣日干 → 三元(0上/1中/2下) */
function yuanOfGan(gan: string): number {
  if ("甲己丁壬".includes(gan)) return 0;
  if ("乙庚戊癸".includes(gan)) return 1;
  return 2; // 丙辛
}
/** 天盤干擊刑宮 */
const JIXING_GONG: Record<string, number> = { 戊: 3, 己: 2, 庚: 8, 辛: 9, 壬: 4, 癸: 4 };
/** 天盤干入墓宮 */
const RUMU_GONG: Record<string, number> = {
  甲: 2, 乙: 2, 丙: 6, 丁: 6, 戊: 6, 己: 6, 庚: 8, 辛: 8, 壬: 4, 癸: 4,
};
/** 驛馬:時支 → 馬星地支 */
function maZhi(zhi: string): string {
  if ("申子辰".includes(zhi)) return "寅";
  if ("寅午戌".includes(zhi)) return "申";
  if ("巳酉丑".includes(zhi)) return "亥";
  return "巳"; // 亥卯未
}
const ZHI_GONG: Record<string, number> = {
  子: 1, 丑: 8, 寅: 8, 卯: 3, 辰: 4, 巳: 4, 午: 9, 未: 2, 申: 2, 酉: 7, 戌: 6, 亥: 6,
};
/** 對沖宮 */
const DUI_CHONG: Record<number, number> = { 1: 9, 9: 1, 2: 8, 8: 2, 3: 7, 7: 3, 4: 6, 6: 4 };
const GAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
/** 宮號順/逆行 k 步(1-9 循環,含中五宮) */
function stepGong(from: number, steps: number, yang: boolean): number {
  let g = from;
  for (let i = 0; i < steps; i++) {
    g = yang ? (g % 9) + 1 : ((g + 7) % 9) + 1;
  }
  return g;
}
function keOf(a: string, b: string): boolean {
  const ke: Record<string, string> = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };
  return ke[a] === b;
}
/** 干支序 0-59(甲子=0) */
function ganzhiIndex(gan: string, zhi: string): number {
  for (let i = 0; i < 60; i++) {
    if (GAN[i % 10] === gan && ZHI[i % 12] === zhi) return i;
  }
  return 0;
}

export function castQimen(input: QimenInput): QimenResult {
  const solar = Solar.fromYmdHms(input.year, input.month, input.day, input.hour, input.minute ?? 0, 0);
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();
  const dayGan = ec.getDayGan();
  const dayZhi = ec.getDayZhi();
  const timeGan = ec.getTimeGan();
  const timeZhi = ec.getTimeZhi();

  // 旬首/旬空
  const xunIdx = Math.floor(ganzhiIndex(timeGan, timeZhi) / 10);
  const xunShou = XUN_SHOU[xunIdx]!;
  const xunKong = XUN_KONG[xunIdx]!;
  const zhiFuYi = XUN_YI[xunIdx]!;

  // 定局:節氣 + 三元(拆補)
  const jq = lunar.getPrevJieQi();
  const jieqi = jq.getName();
  const jqSolar = jq.getSolar();
  const jqParts = jqSolar.toYmdHms().match(/(\d+)-(\d+)-(\d+) (\d+):(\d+)/)!;
  const jqTime = new Date(
    Number(jqParts[1]), Number(jqParts[2]) - 1, Number(jqParts[3]),
    Number(jqParts[4]), Number(jqParts[5]),
  ).getTime();
  const nowTime = new Date(input.year, input.month - 1, input.day, input.hour, input.minute ?? 0).getTime();
  const daysSince = Math.max(0, Math.floor((nowTime - jqTime) / 86400000));
  const jqDayGan = Solar.fromYmdHms(
    Number(jqParts[1]), Number(jqParts[2]), Number(jqParts[3]),
    Number(jqParts[4]), Number(jqParts[5]), 0,
  ).getLunar().getEightChar().getDayGan();
  const yuanIdx = (yuanOfGan(jqDayGan) + Math.floor(daysSince / 5)) % 3;
  const yuan = (["上元", "中元", "下元"] as const)[yuanIdx]!;
  const yang = YANG_JIEQI.has(jieqi);
  const dun = (yang ? "陽遁" : "陰遁") as "陽遁" | "陰遁";
  const ju = JU_TABLE[jieqi]![yuanIdx]!;

  // 地盤三奇六儀
  const diPan: Record<number, string> = {};
  for (let k = 0; k < 9; k++) diPan[stepGong(ju, k, yang)] = YI6[k]!;
  const xunShouGong = Number(Object.keys(diPan).find((g) => diPan[Number(g)] === zhiFuYi))!;
  const zhiFuStar = xunShouGong === 5 ? "天禽"
    : Object.keys(STAR_HOME).find((s) => STAR_HOME[s] === xunShouGong)!;
  const zhiShi = xunShouGong === 5 ? "死門"
    : Object.keys(MEN_HOME).find((m) => MEN_HOME[m] === xunShouGong)!;

  // 天盤九星:值符星加時干宮
  const shiGanGong = Number(Object.keys(diPan).find((g) => diPan[Number(g)] === timeGan))!;
  const starSeq = yang ? STAR_SHUN : [...STAR_SHUN].reverse();
  const startIdx = starSeq.indexOf(zhiFuStar);
  const tianPanStar: Record<number, string> = {};
  const tianPan: Record<number, string> = {};
  for (let k = 0; k < 9; k++) {
    const star = starSeq[(startIdx + k) % 9]!;
    let gong = stepGong(shiGanGong, k, yang);
    if (star === "天禽") gong = 2; // 天禽寄坤二宮
    tianPanStar[gong] = tianPanStar[gong] ? `${tianPanStar[gong]}+${star}` : star;
    const ganOfStar = diPan[STAR_HOME[star]!]!;
    tianPan[gong] = tianPan[gong] ? `${tianPan[gong]}+${ganOfStar}` : ganOfStar;
  }

  // 八門:值使加時干宮(跳過中五宮)
  const menSeq = yang ? MEN_SHUN : [...MEN_SHUN].reverse();
  const menStart = menSeq.indexOf(zhiShi);
  const menPalaceSeq = yang ? [1, 2, 3, 4, 6, 7, 8, 9] : [1, 9, 8, 7, 6, 4, 3, 2];
  const shiMenStart = shiGanGong === 5 ? 2 : shiGanGong;
  const menPos = menPalaceSeq.indexOf(shiMenStart);
  const menAt: Record<number, string> = {};
  for (let k = 0; k < 8; k++) {
    menAt[menPalaceSeq[(menPos + k) % 8]!] = menSeq[(menStart + k) % 8]!;
  }

  // 格局
  const maGong = ZHI_GONG[maZhi(timeZhi)]!;
  const palaces: QimenPalace[] = [];
  for (let gong = 1; gong <= 9; gong++) {
    const patterns: string[] = [];
    const star = (tianPanStar[gong] ?? "").split("+")[0]!;
    const men = menAt[gong] ?? "";
    const tpGan = (tianPan[gong] ?? "").split("+")[0]!;
    const homeStar = Object.keys(STAR_HOME).find((s) => STAR_HOME[s] === gong);
    const homeMen = Object.keys(MEN_HOME).find((m) => MEN_HOME[m] === gong);
    if (star && star === homeStar) patterns.push("星伏吟");
    if (men && men === homeMen) patterns.push("門伏吟");
    if (star && STAR_HOME[star] !== undefined && DUI_CHONG[STAR_HOME[star]!] === gong) patterns.push("星反吟");
    if (men && MEN_HOME[men] !== undefined && DUI_CHONG[MEN_HOME[men]!] === gong) patterns.push("門反吟");
    const kongWang = [...xunKong].some((z) => GONG_ZHI[gong]!.includes(z));
    if (kongWang) patterns.push("空亡");
    if (JIXING_GONG[tpGan] === gong) patterns.push("擊刑");
    if (RUMU_GONG[tpGan] === gong) patterns.push("入墓");
    if (men && keOf(MEN_WUXING[men]!, GONG_WUXING[gong]!)) patterns.push("門迫宮");
    palaces.push({
      gong,
      gongName: GONG_NAME[gong]!,
      zhi: GONG_ZHI[gong]!,
      diPan: diPan[gong]!,
      tianPan: tianPan[gong] ?? "",
      star: tianPanStar[gong] ?? "",
      men,
      patterns,
      maXing: maGong === gong,
      kongWang,
    });
  }

  return {
    input,
    dayGanZhi: dayGan + dayZhi,
    timeGanZhi: timeGan + timeZhi,
    jieqi,
    yuan,
    dun,
    ju,
    xunShou,
    xunKong,
    zhiFu: zhiFuStar,
    zhiShi,
    palaces,
  };
}

/** 五不遇時:時干剋日干。 */
export function isWuBuYuShi(timeGan: string, dayGan: string): boolean {
  const wuxing: Record<string, string> = {
    甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土",
    己: "土", 庚: "金", 辛: "金", 壬: "水", 癸: "水",
  };
  return keOf(wuxing[timeGan]!, wuxing[dayGan]!);
}
