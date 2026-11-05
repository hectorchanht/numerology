import type { KnowledgeMeta } from "./types.js";
import type { Planet } from "./planetary-squares.js";
import type { Sign } from "./tetrabiblos.js";
import DATA from "./calendars.data.js";

/* 曆法三系:Jyotish 27 宿與 Vimshottari、埃及民用曆與 face、十九年週期。 */

export const CALENDARS_META = {
  jyotish: DATA.jyotish.meta,
  egyptian: DATA.egyptian.meta,
  metonic: DATA.metonic.meta,
} as unknown as Record<"jyotish" | "egyptian" | "metonic", KnowledgeMeta>;

export type DashaLord = Planet | "Rahu" | "Ketu";

export const NAKSHATRAS = DATA.jyotish.nakshatras as unknown as { n: number; iast: string; devanagari: string; lord: DashaLord }[];
export const VIMSHOTTARI = DATA.jyotish.vimshottari as unknown as {
  order: DashaLord[]; years: Record<DashaLord, number>; total: number; balanceRule: string; locator: string; yearDays: number; yearDaysAlt: number;
};

export const EGYPTIAN_CIVIL = DATA.egyptian.civil as unknown as {
  months: string[]; epagomenal: string; monthDays: number; epagomenalDays: number;
  epoch: { era: string; julianDate: string; jdn: number; note: string };
};
export const FACES = DATA.egyptian.faces as unknown as { sign: Sign; rulers: [Planet, Planet, Planet] }[];
export const FACES_ORDER = DATA.egyptian.facesOrder as unknown as Planet[];

export const METONIC = DATA.metonic as unknown as {
  meton: { years: number; months: number; yearBCE: number; locator: string; altDate: string };
  chinese: { lines: string[]; locator: string; zhang: number; zhangMonths: number; zhangLeap: number; bu: number; ji: number; yuan: number };
};
