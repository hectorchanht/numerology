import type { KnowledgeMeta } from "./types.js";
import DATA from "./maya.data.js";

export interface MayaName {
  n: number;
  name: string;
  aliases: string[];
}

export const MAYA_META = DATA.meta as unknown as KnowledgeMeta;

/** Tzolk'in 20 日名,n 0–19,n 0 = Imix。 */
export const TZOLKIN_DAY_NAMES = DATA.tzolkin as unknown as MayaName[];

/** Haab' 19 段,n 0–18;n 18 = Wayeb(年末五日)。 */
export const HAAB_MONTHS = DATA.haab as unknown as MayaName[];
