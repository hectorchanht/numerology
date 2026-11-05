import type { KnowledgeMeta } from "./types.js";
import DATA from "./ziwei-stars.data.js";

export interface ZiweiStarEntry {
  /** iztro 簡體名 */
  name: string;
  wuxing: string;
  dou: "北斗" | "南斗" | "中天";
  huaqi?: string;
  zhusi: string;
  cite: string;
}

export const ZIWEI_STARS_META = DATA.meta as unknown as KnowledgeMeta;
export const ZIWEI_STARS = DATA.stars as unknown as ZiweiStarEntry[];
