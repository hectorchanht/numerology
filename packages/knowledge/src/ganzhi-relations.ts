import type { Dizhi, KnowledgeMeta, Tiangan } from "./types.js";
import DATA from "./ganzhi-relations.data.js";

/** 五行(knowledge 自有,不依賴 engine)。 */
export type Wuxing = "木" | "火" | "土" | "金" | "水";

export interface GanzhiRelationsTable {
  ganHe: { pair: [Tiangan, Tiangan]; hua: Wuxing }[];
  ganChong: [Tiangan, Tiangan][];
  zhiLiuHe: { pair: [Dizhi, Dizhi]; hua: Wuxing; note?: string }[];
  /** 中神 = members[1] */
  zhiSanHe: { members: [Dizhi, Dizhi, Dizhi]; hua: Wuxing }[];
  zhiSanHui: { members: [Dizhi, Dizhi, Dizhi]; hua: Wuxing }[];
  zhiChong: [Dizhi, Dizhi][];
  zhiHai: [Dizhi, Dizhi][];
  zhiXing: { members: Dizhi[]; kind: "无恩" | "恃势" | "无礼" | "自刑" }[];
  zhiPo: [Dizhi, Dizhi][];
  cite: Record<"ganHe" | "ganChong" | "zhiLiuHe" | "zhiSanHe" | "zhiSanHui" | "zhiChong" | "zhiHai" | "zhiXing" | "zhiPo", string>;
}

export const GANZHI_RELATIONS_META = DATA.meta as unknown as KnowledgeMeta;
export const GANZHI_RELATIONS = DATA as unknown as GanzhiRelationsTable;
