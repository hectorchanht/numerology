import type { Cite, KnowledgeMeta } from "./types.js";
import DATA from "./science-notes.data.js";

export interface ScienceNote {
  id: string;
  claim: Record<"zht" | "zhs" | "en", string>;
  relatesTo: ("personality" | "birth-timing" | "coincidence")[];
  cite: Cite;
  reviewed: boolean;
}

export const SCIENCE_NOTES_META: KnowledgeMeta = DATA.meta;

export const SCIENCE_NOTES: ScienceNote[] = DATA.notes as ScienceNote[];
