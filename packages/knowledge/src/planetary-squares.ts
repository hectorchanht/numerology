import type { KnowledgeMeta } from "./types.js";
import DATA from "./planetary-squares.data.js";

export type Planet = "Saturn" | "Jupiter" | "Mars" | "Sun" | "Venus" | "Mercury" | "Moon";

export interface PlanetarySquare {
  planet: Planet;
  greek: string;
  order: number;
  rows: number[][];
  note?: string;
  /** Sun 方陣的 Intelligence / Spirit(名、希伯來文、數值)。 */
  intelligence?: { name: string; hebrew: string; value: number };
  spirit?: { name: string; hebrew: string; value: number };
  /** 版本勘誤(如 1533 版 Moon 方陣誤印)。 */
  erratum?: string;
}

export const PLANETARY_SQUARES_META: KnowledgeMeta = DATA.meta;

/** 查行星幻方。找不到拋錯(快速失敗)。 */
export function planetarySquare(planet: Planet): PlanetarySquare {
  const s = (DATA.squares as PlanetarySquare[]).find((x) => x.planet === planet);
  if (!s) throw new Error("未知行星:" + planet);
  return s;
}
