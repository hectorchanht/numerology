import type { KnowledgeMeta } from "./types.js";
import DATA from "./liuren.data.js";

/** 大六壬起課規則表(《六壬大全》)。引擎見 packages/engine/src/liuren.ts。 */
export interface LiurenMethod {
  id: string;
  name: string;
  sub: string[];
  cite: string;
  rule: string;
  cites?: string[];
  note?: string;
  /** 本站取法(書無明文)部份 */
  modern?: { tier: string; item: string; note: string }[];
}

export const LIUREN_META = DATA.meta as unknown as KnowledgeMeta;
export const LIUREN_CITE: { work: string; locator: string } = DATA.cite;
/** 中氣(繁體名)→ 月將支 */
export const LIUREN_YUEJIANG: Record<string, string> = DATA.yuejiang.values;
/** 月將支 → 神名(登明、河魁…) */
export const LIUREN_SHEN_NAME: Record<string, string> = DATA.shenName.values;
/** 日干 → 寄宮支 */
export const LIUREN_JIGONG: Record<string, string> = DATA.jigong.values;
/** 日干 → { day: 支, night: 支 } */
export const LIUREN_GUIREN: Record<string, { day: string; night: string }> =
  DATA.guiren.values;
/** 十二天將,貴人起 */
export const LIUREN_JIANG: readonly string[] = DATA.jiang.values;
/** 九宗門,依取課次序排 */
export const LIUREN_METHODS: readonly LiurenMethod[] = DATA.methods;
/** 晝夜:占時支 → 用旦(day)或夜(night)貴(本站取法) */
export const LIUREN_DAY_NIGHT: { day: readonly string[]; night: readonly string[] } = DATA.dayNight;
/** 貴人所臨地盤支 → 天將順布(forward)或逆布(backward) */
export const LIUREN_DIRECTION: { forward: readonly string[]; backward: readonly string[] } = DATA.direction;
/** 伏吟傳刑:支 → 所刑之支 */
export const LIUREN_XING: Record<string, string> = DATA.xing.values;
/** 六親:日干對支五行關係(生日/日生/剋日/日剋/同類)→ 父母/子孫/官鬼/妻財/兄弟 */
export const LIUREN_LIUQIN: Record<"生日" | "日生" | "剋日" | "日剋" | "同類", string> = DATA.liuqin.values;
