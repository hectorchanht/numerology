/**
 * 易經六十四卦知識庫 API(型別 + 查表 + 術語釋義)。
 * 數據本體見 `./yijing.data.js`(生成文件)。
 *
 * 數據來源(見 yijing.data.ts 文件頭 Attribution):
 *  - 卦辭/爻辭/大象辭: crane1102/iching-llm (MIT),通行本《周易》公版古籍
 *  - 卦名拼音/英文: FENGTING2025/iching-64-hexagrams-json (MIT)
 *  - 上下卦/五行/陰陽 + 現代解讀: HeTaobaba123/iching-64-hexagrams-dataset (CC0-1.0)
 */
import { HEXAGRAMS, YIJING_META } from "./yijing.data.js";

export { YIJING_META };

/** 八卦名(繁體) */
export const TRIGRAMS = ["乾", "兌", "離", "震", "巽", "坎", "艮", "坤"] as const;
export type TrigramName = (typeof TRIGRAMS)[number];

/** 八卦資訊:符號/拼音/英文/卦性/五行 */
export const TRIGRAM_INFO: Record<
  TrigramName,
  { symbol: string; pinyin: string; en: string; nature: string; element: string }
> = {
  乾: { symbol: "☰", pinyin: "qián", en: "Heaven", nature: "天", element: "金" },
  兌: { symbol: "☱", pinyin: "duì", en: "Lake", nature: "澤", element: "金" },
  離: { symbol: "☲", pinyin: "lí", en: "Fire", nature: "火", element: "火" },
  震: { symbol: "☳", pinyin: "zhèn", en: "Thunder", nature: "雷", element: "木" },
  巽: { symbol: "☴", pinyin: "xùn", en: "Wind", nature: "風", element: "木" },
  坎: { symbol: "☵", pinyin: "kǎn", en: "Water", nature: "水", element: "水" },
  艮: { symbol: "☶", pinyin: "gèn", en: "Mountain", nature: "山", element: "土" },
  坤: { symbol: "☷", pinyin: "kūn", en: "Earth", nature: "地", element: "土" },
};

export function isTrigramName(x: string): x is TrigramName {
  return (TRIGRAMS as readonly string[]).includes(x);
}

/** 單一語境的現代解讀(事業/感情/財運/健康/建議) */
export interface YijingInterp {
  coreMeaning: string;
  career: string;
  love: string;
  wealth: string;
  health: string;
  advice: string;
}

export type YijingLocale = "zht" | "zhs" | "en";

/** 單卦 */
export interface Hexagram {
  /** 文王卦序 1–64 */
  number: number;
  name: string;
  nameEn: string;
  pinyin: string;
  /** 卦名粵拼(如 "kin4","siu2 cuk1");易經特殊讀音已按正音核對 */
  jyutping: string;
  /** 卦符,如 ䷀ */
  symbol: string;
  upperTrigram: TrigramName;
  lowerTrigram: TrigramName;
  /** 五行(按上卦取) */
  element: "金" | "木" | "水" | "火" | "土";
  yinYang: "陽" | "陰";
  /** 卦辭 */
  judgment: string;
  /** 六爻爻辭,初爻 → 上爻 */
  lines: string[];
  /** 大象辭 */
  image: string;
  /** 六爻陰陽(由下而上),1=陽 0=陰 */
  bits: number[];
  zht: YijingInterp;
  zhs: YijingInterp;
  en: YijingInterp;
}

const BY_NUMBER = new Map<number, Hexagram>(HEXAGRAMS.map((h) => [h.number, h]));

/** 取全部 64 卦(文王卦序) */
export function allHexagrams(): Hexagram[] {
  return HEXAGRAMS;
}

/** 按文王卦序取卦 */
export function getHexagram(n: number): Hexagram | undefined {
  return BY_NUMBER.get(n);
}

/** 去聲調(拼音搜尋用):Qián → qian */
function stripTones(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** 搜尋卦:卦名/拼音(可無聲調)/英文/卦序數字 */
export function searchHexagrams(q: string): Hexagram[] {
  const raw = q.trim();
  const needle = raw.toLowerCase();
  if (!needle) return HEXAGRAMS;
  const num = Number(needle);
  return HEXAGRAMS.filter(
    (h) =>
      h.name.includes(raw) ||
      stripTones(h.pinyin).toLowerCase().includes(needle) ||
      h.nameEn.toLowerCase().includes(needle) ||
      (Number.isInteger(num) && h.number === num),
  );
}

const YAO_POSITION = ["初", "二", "三", "四", "五", "上"] as const;

/**
 * 爻位名稱:初爻/上爻為「初九」「上六」(位在前),中四爻為「九二」「六三」
 * (陰陽在前)。如 乾卦初爻 →「初九」、坤卦二爻 →「六二」。
 * @param position 1–6(由下而上)
 */
export function yaoName(hex: Hexagram, position: number): string {
  if (position < 1 || position > 6) throw new Error(`爻位 ${position} 超出 1–6`);
  const yy = hex.bits[position - 1] === 1 ? "九" : "六";
  const pos = YAO_POSITION[position - 1];
  return position === 1 || position === 6 ? `${pos}${yy}` : `${yy}${pos}`;
}

/** 取某語境的解讀 */
export function interpOf(hex: Hexagram, locale: YijingLocale): YijingInterp {
  return hex[locale];
}

/* ── 術語釋義:搬咗去 ./glossary.ts(獨立模組,UI 只要術語唔使拖成份卦辭數據) ── */
export { YIJING_GLOSSARY, lookupGlossary, type GlossaryTerm } from "./glossary.js";
