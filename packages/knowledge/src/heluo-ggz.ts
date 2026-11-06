import type { KnowledgeMeta } from "./types.js";
import DATA from "./heluo-ggz.data.js";

export const HELUO_GGZ_META = DATA.meta as unknown as KnowledgeMeta;

/** 金鎖銀匙取數(卷六 pp. 218–225):二千為基,日支數至時支乘百,加支序、納音加數、部數。 */
export const JINSUO = DATA.jinsuoYinshi as unknown as {
  page: [number, number];
  base: number;
  nayinAdd: Record<"水" | "火" | "土" | "木" | "金", number>;
  buNumber: Record<"水" | "火" | "土" | "木" | "金", number>;
};

/** 廣象徹微四象積數(pp. 459–483):元 1、會 2、運 3、世 4。 */
export const GUANGXIANG = DATA.guangxiang as unknown as {
  page: [number, number];
  values: Record<"元" | "會" | "運" | "世", number>;
};
