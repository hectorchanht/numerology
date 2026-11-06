import type { KnowledgeMeta } from "./types.js";
import DATA from "./qizheng.data.js";

/** 二十八宿:序、名、距星(名 + HIP)、J2000 黃經(度)、古度(觜為 0 並標 attachedTo:"參") */
export interface QizhengMansion {
  n: number;
  name: string;
  star: string;
  hip: number;
  raJ2000: number;
  decJ2000: number;
  lonJ2000: number;
  /** 《六壬大全》卷十一 正度 + 初度 1;合 365 */
  ancientDeg: number;
  attachedTo?: string;
  /** 《星學大成》歌訣讀法,只作對校 */
  variants?: string[];
}

export type QizhengBody = "Sun" | "Moon" | "Mercury" | "Venus" | "Mars" | "Jupiter" | "Saturn";

/** 四餘:全部為推算點;紫氣為流派公式(tier modern) */
export interface QizhengYu {
  id: "luohou" | "jidu" | "yuebei" | "ziqi";
  name: string;
  definition: string;
  formula: string;
  tier: "classical" | "modern";
  cite: string;
  variants?: string[];
}

export const QIZHENG_META = DATA.meta as unknown as KnowledgeMeta;
export const QIZHENG_MANSIONS = DATA.mansions as unknown as readonly QizhengMansion[];
export const QIZHENG_SEVEN = DATA.seven as unknown as readonly { body: QizhengBody; name: string; alias: string }[];
export const QIZHENG_YU = DATA.yu as unknown as readonly QizhengYu[];
/** 紫氣根數(已換算為回歸黃經 + JD(UT)):lon = lonAtEpoch + degPerDay·(jd − epochJd) */
export const QIZHENG_ZIQI = DATA.ziqi as { epochJd: number; lonAtEpoch: number; degPerDay: number; source: string; note: string };
