import type { KnowledgeMeta } from "./types.js";
import type { TrigramName } from "./yijing.js";
import DATA from "./heluo-lishu.data.js";

export const HELUO_META = DATA.meta as unknown as KnowledgeMeta;

/** 天干洛書數、地支河圖數。 */
export const HELUO_STEM_NUMBER = DATA.stemNumbers.values as unknown as Record<string, number>;
export const HELUO_BRANCH_NUMBER = DATA.branchNumbers.values as unknown as Record<string, [number, number]>;

/** 洛書數 → 卦(五寄中宮,另按寄宮詩)。 */
export const HELUO_LUOSHU_TRIGRAM = DATA.luoshuTrigram.values as unknown as Record<string, TrigramName>;

/** 寄宮詩:三元 × 陰陽男女得五取卦。 */
export const HELUO_FIVE = DATA.fiveRule as unknown as {
  upper: { male: TrigramName; female: TrigramName };
  middle: { yangMale: TrigramName; yinFemale: TrigramName; yinMale: TrigramName; yangFemale: TrigramName };
  lower: { male: TrigramName; female: TrigramName };
};

/** 上元起年(弘治甲子 1504),三元一周 180 年。 */
export const HELUO_UPPER_ANCHOR = DATA.yuan.anchorUpper;

/** 乾坤純卦元堂次序。 */
export const HELUO_PURE_ORDER = DATA.yuantang.pure.orders as unknown as Record<"順" | "逆", Record<"陽" | "陰", number[]>>;

/** 元氣:生年干、支所屬卦。 */
export const HELUO_YUANQI = DATA.yuanqi as unknown as { stems: Record<string, TrigramName>; branches: Record<string, TrigramName> };

/** 化工:四正節氣段同季月土旺。 */
export const HELUO_HUAGONG = DATA.huagong as unknown as {
  periods: { from: string; to: string; trigram: TrigramName; reverse: TrigramName }[];
  earth: { trigrams: TrigramName[]; reverse: TrigramName[] };
};

/** 大運:陽爻九年、陰爻六年。 */
export const HELUO_DAYUN = DATA.dayun as unknown as { yang: number; yin: number };

/** 三至尊卦。 */
export const HELUO_ZHIZUN = DATA.zhizun.hexagrams as unknown as string[];
