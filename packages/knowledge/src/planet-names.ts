import type { KnowledgeMeta } from "./types.js";
import type { Planet } from "./planetary-squares.js";
import DATA from "./planet-names.data.js";

export const PLANET_NAMES_META = DATA.cabalaMeta as unknown as KnowledgeMeta;
export const ARBATEL_META = DATA.fourthMeta as unknown as KnowledgeMeta;

/** 幻方數所對應的神名、Intelligence、Spirit;ref 指該數是幻方的階(order)、格數(cells)、行和(line)或總和(total)。 */
export interface PlanetName {
  /** unresolved 條目另有 "intelligences"、"spirit of spirits" 等稱 */
  role: string;
  name: string;
  hebrew: string;
  value: number;
  ref: "order" | "cells" | "line" | "total" | null;
  /** 原書數值與希伯來字母和對不上,未能校正 */
  unresolved?: boolean;
  erratum?: string;
}

/** Agrippa 卷二第 22 章各行星幻方之名。 */
export const PLANET_NAMES = DATA.planetaryNames as unknown as Record<Planet, PlanetName[]>;

/** Arbatel 七奧林匹亞靈(Fourth Book 1655 p. 183)。 */
export const OLYMPIC_SPIRITS = DATA.arbatel.spirits as unknown as { name: string; planet: Planet; provinces: number; erratum?: string }[];
export const ARBATEL_PAGE = DATA.arbatel.page;
