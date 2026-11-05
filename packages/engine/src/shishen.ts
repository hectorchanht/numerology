import { isTiangan, type Tiangan } from "@numerology/knowledge";

type WuXing = "木" | "火" | "土" | "金" | "水";

const WUXING: Record<Tiangan, WuXing> = {
  甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土",
  己: "土", 庚: "金", 辛: "金", 壬: "水", 癸: "水",
};

/** 陽=true,陰=false */
const IS_YANG: Record<Tiangan, boolean> = {
  甲: true, 乙: false, 丙: true, 丁: false, 戊: true,
  己: false, 庚: true, 辛: false, 壬: true, 癸: false,
};

/** 五行相生:鍵 生 值 */
const SHENG: Record<WuXing, WuXing> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
/** 五行相剋:鍵 克 值 */
const KE: Record<WuXing, WuXing> = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };

export type ShiShen =
  | "比肩" | "劫财" | "食神" | "伤官" | "偏财"
  | "正财" | "七杀" | "正官" | "偏印" | "正印";

/**
 * 計算某天干相對日主的十神。確定性,基於五行生剋 + 陰陽同異。
 * @example shiShen("庚", "丁") => "正官"
 */
export function shiShen(dayGan: Tiangan, otherGan: Tiangan): ShiShen {
  const wd = WUXING[dayGan];
  const wo = WUXING[otherGan];
  const samePolarity = IS_YANG[dayGan] === IS_YANG[otherGan];

  if (wd === wo) return samePolarity ? "比肩" : "劫财";
  if (SHENG[wd] === wo) return samePolarity ? "食神" : "伤官"; // 我生
  if (SHENG[wo] === wd) return samePolarity ? "偏印" : "正印"; // 生我
  if (KE[wd] === wo) return samePolarity ? "偏财" : "正财"; // 我克
  return samePolarity ? "七杀" : "正官"; // 克我
}

/** 安全版:接受字符串,非法天干返回 undefined。 */
export function shiShenOf(dayGan: string, otherGan: string): ShiShen | undefined {
  if (!isTiangan(dayGan) || !isTiangan(otherGan)) return undefined;
  return shiShen(dayGan, otherGan);
}

/** 十二地支藏干(本氣在前)。標準表,與 lunar-javascript 輸出一致。 */
const HIDE_GAN: Record<string, Tiangan[]> = {
  子: ["癸"], 丑: ["己", "癸", "辛"], 寅: ["甲", "丙", "戊"], 卯: ["乙"],
  辰: ["戊", "乙", "癸"], 巳: ["丙", "庚", "戊"], 午: ["丁", "己"], 未: ["己", "丁", "乙"],
  申: ["庚", "壬", "戊"], 酉: ["辛"], 戌: ["戊", "辛", "丁"], 亥: ["壬", "甲"],
};

/** 取地支藏干。未知地支返回空數組。 */
export function dizhiHideGan(zhi: string): Tiangan[] {
  return HIDE_GAN[zhi] ? [...HIDE_GAN[zhi]] : [];
}

export { WUXING, KE };
