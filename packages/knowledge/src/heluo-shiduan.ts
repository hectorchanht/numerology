import type { KnowledgeMeta } from "./types.js";
import DATA from "./heluo-shiduan.data.js";

export const HELUO_SHIDUAN_META = DATA.meta as unknown as KnowledgeMeta;

export interface HeluoPoem {
  /** 詩前小注:陰、陽、陽五、陰五 */
  tag?: string;
  text: string;
}

export interface HeluoLineText {
  line: number;
  yao: string;
  ci: string;
  /** 卷二爻斷(叶者、不叶者兩面) */
  duan: string;
  /** 卷三爻訣 */
  poems: HeluoPoem[];
  page2: number;
  page3: number;
}

export interface HeluoHexText {
  hex: string;
  /** 卷二卦註(生月、納甲、宮世) */
  gua: { page: number; text: string };
  /** 卷三總訣 */
  zong: { page3: number; poems: HeluoPoem[] };
  lines: HeluoLineText[];
}

const HEX = DATA.hexagrams as unknown as HeluoHexText[];

/** 卷二、卷三原文:按卦名取;line 1–6 由下而上。 */
export function heluoText(hex: string): HeluoHexText | undefined {
  return HEX.find((h) => h.hex === hex);
}
