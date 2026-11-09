import type { KnowledgeMeta } from "./types.js";
import DATA from "./ziwei-geju.data.js";

/** 格局條件 DSL(引擎解讀);星名用 iztro 簡體名 */
export type ZiweiGejuCond =
  | { op: "samePalace"; stars: string[]; branches?: string[]; brightness?: string[] }
  /** mutagens = 池中須有帶此等四化嘅星(brightness 亦適用於佢哋) */
  | { op: "inSanFang"; stars: string[]; brightness?: string[]; mutagens?: string[] }
  /** stars 可為 [] 配 branches,只限制命宫地支;brightness = 每顆星亮度須屬其中 */
  | { op: "inPalace"; stars: string[]; palace: "命宫"; branches?: string[]; brightness?: string[]; mutagens?: string[] }
  /** 夾命:stars 兩顆,命宮左右兩鄰各一 */
  | { op: "flank"; stars: [string, string]; palace: "命宫" }
  | { op: "noMajor"; palace: "命宫" };

export interface ZiweiGejuRule {
  id: string;
  name: string;
  /** 全部成立先成格 */
  all: ZiweiGejuCond[];
  /** 有則其中一條成立亦要成立 */
  any?: ZiweiGejuCond[];
  verdict: "吉" | "凶" | "中";
  cite: string;
}

export const ZIWEI_GEJU_META = DATA.meta as unknown as KnowledgeMeta;
export const ZIWEI_GEJU = DATA.rules as unknown as ZiweiGejuRule[];
