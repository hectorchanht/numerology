import type { KnowledgeMeta } from "./types.js";
import DATA from "./tieban.data.js";

/** 鐵版神數知識條目。只記源流、出處、流程說法;不含任何條文(無公開可重算算法)。 */
export interface TiebanEntry {
  id: string;
  topic: "origin" | "siku" | "procedure" | "relation";
  /** 本站白話摘要 */
  zht: string;
  /** 古籍原文短引(≤30 字,只限公版古籍) */
  quote?: string;
  cite: string;
  /** 術家說法逐條標 modern */
  tier?: "modern";
}

export const TIEBAN_META = DATA.meta as unknown as KnowledgeMeta;
export const TIEBAN = DATA.entries as unknown as TiebanEntry[];
