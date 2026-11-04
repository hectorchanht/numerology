/** 十天干 */
export const TIANGAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
export type Tiangan = (typeof TIANGAN)[number];

/** 十二地支 */
export const DIZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
export type Dizhi = (typeof DIZHI)[number];

export function isTiangan(x: string): x is Tiangan {
  return (TIANGAN as readonly string[]).includes(x);
}

export function isDizhi(x: string): x is Dizhi {
  return (DIZHI as readonly string[]).includes(x);
}

/** 知識分級:古典 / 學術 / 現代 / 科學。缺省時 UI 顯示「未分級」。 */
export type KnowledgeTier = "classical" | "scholarly" | "modern" | "science";

/** 出處引用 */
export interface Cite {
  work: string;
  author?: string;
  year?: number | string;
  locator?: string;
}

/** 知識庫數據文件通用元信息 */
export interface KnowledgeMeta {
  tier?: KnowledgeTier;
  name: string;
  schema: string;
  source: string;
  version: string;
  /** 是否經人工逐條校對原著。false 時解讀層應降權或標註。 */
  reviewed: boolean;
  reviewNote?: string;
  [extra: string]: unknown;
}

/** 窮通寶鑑調候用神表:日干 -> 月支 -> 用神(按重要性排序) */
export interface TiaohouTable {
  meta: KnowledgeMeta;
  data: Record<Tiangan, Record<Dizhi, Tiangan[]>>;
}
