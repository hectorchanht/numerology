import type { KnowledgeMeta } from "./types.js";
import type { Planet } from "./planetary-squares.js";
import type { Sign } from "./tetrabiblos.js";
import DATA from "./lore.data.js";

/*
 * 數之學:Agrippa 數階、Nicomachus 數論、Fideler gematria、希伯來字母值、Sefer Yetzirah、律呂、Timaeus、Behenian 恆星。
 * 原始 JSON 各有自己的 test;本模組只做型別化出口。
 */

export const LORE_META = {
  scales: DATA.scales.meta,
  nicomachus: DATA.nicomachus.meta,
  gematria: DATA.gematria.meta,
  correspondences: DATA.correspondences.meta,
  seferYetzirah: DATA.seferYetzirah.meta,
  lulu: DATA.lulu.meta,
  timaeus: DATA.timaeus.meta,
  behenian: DATA.behenian.meta,
} as unknown as Record<"scales" | "nicomachus" | "gematria" | "correspondences" | "seferYetzirah" | "lulu" | "timaeus" | "behenian", KnowledgeMeta>;

export interface AgrippaScaleRow { world: string; label: string; items: string[] }
/** Agrippa 卷二第 4–14 章數階(1–10、12)。 */
export const AGRIPPA_SCALES = DATA.scales.items as unknown as { n: number; chapter: number; page: number | null; rows: AgrippaScaleRow[] }[];

export const NICOMACHUS = DATA.nicomachus as unknown as {
  perfect: { page: number; method: string; known: number[]; claims: { id: string; text: string; tier: string; holdsFor: number }[] };
  figurate: { page: number; rule: string; items: { sides: number; name: string; page: number; seq: number[] }[]; relations: { page: number; text: string }[] };
  cubes: { page: number; seq: number[]; rule: string };
};

export interface GematriaTerm { greek: string; gloss: string; value: number; page: number; note?: string }
export const GEMATRIA_TERMS = DATA.gematria.terms as unknown as GematriaTerm[];
export const GEMATRIA_RELATIONS = DATA.gematria.relations as unknown as { id: string; latex: string; expr: string; target: number; tol: number; terms: string[]; page: number }[];

/** 希伯來 22 字母數值(Agrippa 卷一表)。 */
export const HEBREW_LETTERS = DATA.correspondences.hebrew.letters as unknown as { glyph: string; name: string; value: number }[];
export const ZODIAC_CORRESPONDENCES = DATA.correspondences.zodiac as unknown as { sign: Sign; ruler: Planet; herb: string; fume: string; house: number }[];
export const BEHENIAN_AGRIPPA = DATA.correspondences.fixedStars.stars as unknown as { n: number; name: string; stones: string[]; plants: string[]; metals?: string[] }[];

export const SEFER_YETZIRAH = DATA.seferYetzirah as unknown as {
  mothers: { page: number; items: { letter: string; name: string; element: string }[] };
  doubles: { letters: string[]; supplement: { page: number; tier: "modern"; items: { letter: string; quality: string; planet: Planet; day: number }[] } };
  simples: { letters: string[]; supplement: { pages: number[]; tier: "modern"; items: { letter: string; faculty: string; sign: Sign; month: string }[] } };
};

export const LULU = DATA.lulu as unknown as {
  rules: Record<string, string>;
  guanzi: { fiveNotes: { note: string; value: number; step: "up" | "down" | null }[] };
  lushi: { order: string[]; upper: string[]; lower: string[]; season: Record<string, string> };
  huainanzi: { modes: Record<string, string>; pipes: { pipe: string; value: number; month: number; next: "up" | "down" | null }[] };
};

export const TIMAEUS = DATA.timaeus as unknown as {
  worldSoul: { stephanus: string; seven: number[]; double: number[]; triple: number[]; filledDouble: string[]; filledTriple: string[]; leimma: string };
  solids: { stephanus: string; items: { element: string; solid: string; faces: number; faceShape: string }[]; fifth: string };
};

export interface BehenianStar { n: number; agrippa: string; name: string; bayer: string; ra: string; dec: string; lon2020: string; alt?: { name: string; bayer: string; ra: string; dec: string; note: string } }
export const BEHENIAN = DATA.behenian as unknown as { orb: { degrees: number; tier: "modern"; text: string; cite: string }; stars: BehenianStar[] };
