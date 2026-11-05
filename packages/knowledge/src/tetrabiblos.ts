import type { KnowledgeMeta } from "./types.js";
import type { Planet } from "./planetary-squares.js";
import DATA from "./tetrabiblos.data.js";

export const TETRABIBLOS_META = DATA.meta as unknown as KnowledgeMeta;

export type Sign = (typeof DATA.signs)[number];

/** 十二宮(白羊起)。 */
export const SIGNS = DATA.signs as unknown as Sign[];

/** 宮主:日月各一宮,五星各有日宮、夜宮。 */
export const DOMICILE: Record<Sign, Planet> = Object.fromEntries([
  ...Object.entries(DATA.houses.luminaries).map(([p, s]) => [s, p]),
  ...Object.entries(DATA.houses.planets).flatMap(([p, h]) => [[h.day, p], [h.night, p]]),
]) as Record<Sign, Planet>;

/** 廟旺 / 落陷宮。 */
export const EXALTATION = DATA.exaltations.items as unknown as Record<Planet, { sign: Sign; fall: Sign }>;

/** 三方主星(晝 / 夜;水象三方另有 Mars 共主)。 */
export const TRIPLICITY = DATA.triplicities.items as unknown as { signs: Sign[]; day: Planet; night: Planet; participating?: Planet }[];

/** 埃及界:每宮五段,度數加埋 30。 */
export const EGYPTIAN_TERMS = DATA.egyptianTerms.bySign as unknown as Record<Sign, { planet: Planet; deg: number }[]>;

/** 托勒密相位度數。 */
export const ASPECTS = DATA.aspects.degrees as unknown as Record<"opposition" | "trine" | "quartile" | "sextile", number>;

/** 吉凶、陰陽、晝夜。 */
export const NATURES = DATA.natures as unknown as Record<"benefic" | "malefic" | "common" | "diurnal" | "nocturnal" | "bothSects", Planet[]>;
