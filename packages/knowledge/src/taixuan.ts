import type { Cite, KnowledgeMeta } from "./types.js";
import DATA from "./taixuan.data.js";

export interface TaixuanHead {
  n: number;
  name: string;
  cite: Cite;
}

export const TAIXUAN_META = DATA.meta as unknown as KnowledgeMeta;

const HEADS = DATA.heads as unknown as TaixuanHead[];

/** 第 n 首(1–81);越界拋錯。 */
export function taixuanHead(n: number): TaixuanHead {
  const h = Number.isInteger(n) ? HEADS[n - 1] : undefined;
  if (!h) throw new RangeError(`太玄首序越界: ${n}`);
  return h;
}
