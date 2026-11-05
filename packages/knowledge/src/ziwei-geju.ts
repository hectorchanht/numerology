import type { KnowledgeMeta } from "./types.js";
import DATA from "./ziwei-geju.data.js";

/** 格局條件 DSL(引擎解讀);星名用 iztro 簡體名 */
export type ZiweiGejuCond =
  | { op: "samePalace"; stars: string[]; branches?: string[] }
  | { op: "inSanFang"; stars: string[] }
  | { op: "inPalace"; stars: string[]; palace: "命宫"; branches?: string[] }
  | { op: "noMajor"; palace: "命宫" };

export interface ZiweiGejuRule {
  id: string;
  name: string;
  /** 全部成立先成格 */
  all: ZiweiGejuCond[];
  verdict: "吉" | "凶" | "中";
  cite: string;
}

export const ZIWEI_GEJU_META = DATA.meta as unknown as KnowledgeMeta;
export const ZIWEI_GEJU = DATA.rules as unknown as ZiweiGejuRule[];
