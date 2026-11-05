import type { KnowledgeMeta } from "./types.js";
import DATA from "./huangji-jingshi.data.js";

export const HUANGJI_META = DATA.meta as unknown as KnowledgeMeta;

/** 紀年錨點:唐堯元年甲辰(元內第 2156 世第 11 年,天文紀年 −2356)。 */
export const HUANGJI_YAO = DATA.anchors.find((a) => a.label === "唐堯元年") as unknown as {
  label: string; hui: number; yun: number; shi: number; yearInShi: number; ganzhi: string; ad: number;
};

/** 開物 / 閉物所在運。 */
export const HUANGJI_OPEN_YUN = DATA.anchors.find((a) => a.label === "開物")!.yun as number;
export const HUANGJI_CLOSE_YUN = DATA.anchors.find((a) => a.label === "閉物")!.yun as number;
