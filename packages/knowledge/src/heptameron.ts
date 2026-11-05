import type { KnowledgeMeta } from "./types.js";
import type { Planet } from "./planetary-squares.js";
import DATA from "./heptameron.data.js";

export const HEPTAMERON_META = DATA.meta as unknown as KnowledgeMeta;

const H = DATA.heptameron;

/** 迦勒底行星次序(Saturn → Moon);行星時按此序輪轉。 */
export const CHALDEAN_ORDER = H.chaldeanOrder as unknown as Planet[];

/** 行星天使(Cassiel、Sachiel……)。 */
export const PLANET_ANGEL = H.angelOfPlanet as unknown as Record<Planet, string>;

/** 日間 / 夜間 12 時辰名(第 1 時起)。 */
export const HOUR_NAMES = H.hourNames as unknown as { day: string[]; night: string[] };
