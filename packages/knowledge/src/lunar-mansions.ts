import type { KnowledgeMeta } from "./types.js";
import DATA from "./lunar-mansions.data.js";

export const LUNAR_MANSIONS_META = DATA.meta as unknown as KnowledgeMeta;

/** Agrippa 二十八月宿:由白羊 0° 起,每宿 360°/28。 */
export const LUNAR_MANSIONS = DATA.lunarMansions.mansions as unknown as { n: number; names: string[]; meaning: string | null; uses: string[] }[];
