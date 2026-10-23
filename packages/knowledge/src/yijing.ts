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

/* ── 術語釋義(tap-to-define,學院模式) ─────────────────────────────── */

export interface GlossaryTerm {
  term: string;
  zht: string;
  zhs: string;
  en: string;
}

/** 易經核心術語(短釋義,供 UI 點按釋義用) */
export const YIJING_GLOSSARY: GlossaryTerm[] = [
  { term: "卦", zht: "由六爻組成的符號,代表一種時勢格局。六十四卦即六十四種基本情境。", zhs: "由六爻组成的符号,代表一种时势格局。六十四卦即六十四种基本情境。", en: "A six-line figure representing a situation or pattern. The 64 hexagrams are 64 basic situations." },
  { term: "爻", zht: "組成卦的基本單位,一爻為一橫:陽爻為實線 ⚊,陰爻為斷線 ⚋。", zhs: "组成卦的基本单位,一爻为一横:阳爻为实线 ⚊,阴爻为断线 ⚋。", en: "The basic unit of a hexagram: a solid line ⚊ (yang) or a broken line ⚋ (yin)." },
  { term: "卦辭", zht: "《周易》中每卦開頭的斷語,總論該卦的吉凶大勢。", zhs: "《周易》中每卦开头的断语,总论该卦的吉凶大势。", en: "The judgment text at the start of each hexagram — an overall verdict on its trend." },
  { term: "爻辭", zht: "每爻的斷語,講該爻所處位置的吉凶與應對。六爻由下而上為初、二、三、四、五、上。", zhs: "每爻的断语,讲该爻所处位置的吉凶与应对。六爻由下而上为初、二、三、四、五、上。", en: "The text for each line, describing fortune and conduct for that position, from bottom (初) to top (上)." },
  { term: "大象", zht: "《象傳》對全卦的詮釋,多以「君子以…」作結,講處世之道。", zhs: "《象传》对全卦的诠释,多以「君子以…」作结,讲处世之道。", en: "The 'Great Image' commentary on a hexagram, usually ending with how a noble person should act." },
  { term: "元亨利貞", zht: "乾卦卦辭四字,傳統解為:元(創始)、亨(通達)、利(適宜)、貞(正固)。後世引申為事情的四個階段。", zhs: "乾卦卦辞四字,传统解为:元(创始)、亨(通达)、利(适宜)、贞(正固)。后世引申为事情的四个阶段。", en: "The four words of the Qian judgment: origination, prevalence, fitness, perseverance." },
  { term: "九 / 六", zht: "爻的陰陽代號:九為陽爻,六為陰爻。如「九二」是第二爻的陽爻,「六三」是第三爻的陰爻。", zhs: "爻的阴阳代号:九为阳爻,六为阴爻。如「九二」是第二爻的阳爻,「六三」是第三爻的阴爻。", en: "Line codes: 九 = yang line, 六 = yin line. 九二 is the yang line in 2nd position." },
  { term: "老陽 / 老陰", zht: "揲蓍或擲錢所得:老陽(⚊○)與老陰(⚋×)為「動爻」,會變成相反的爻,形成變卦。", zhs: "揲蓍或掷钱所得:老阳(⚊○)与老阴(⚋×)为「动爻」,会变成相反的爻,形成变卦。", en: "Old yang (⚊○) and old yin (⚋×) are 'moving lines' that flip to form the changed hexagram." },
  { term: "少陽 / 少陰", zht: "靜爻,不變動:少陽為陽爻 ⚊,少陰為陰爻 ⚋。", zhs: "静爻,不变动:少阳为阳爻 ⚊,少阴为阴爻 ⚋。", en: "Young yang ⚊ and young yin ⚋ are stable lines that do not change." },
  { term: "動爻", zht: "起卦時得到的老陽或老陰。動爻是解卦的關鍵:看它的爻辭,也看它變出什麼卦。", zhs: "起卦时得到的老阳或老阴。动爻是解卦的关键:看它的爻辞,也看它变出什么卦。", en: "A moving (old yang / old yin) line. Read its line text and the resulting changed hexagram." },
  { term: "本卦", zht: "起卦直接得到的卦,代表問事當下的狀態。", zhs: "起卦直接得到的卦,代表问事当下的状态。", en: "The hexagram first cast — the present state of the matter asked about." },
  { term: "變卦", zht: "動爻翻轉後得到的卦,代表事情發展的去向。無動爻則不看變卦。", zhs: "动爻翻转后得到的卦,代表事情发展的去向。无动爻则不看变卦。", en: "The hexagram after flipping moving lines — where the matter is heading." },
  { term: "互卦", zht: "取本卦二三四爻為下卦、三四五爻為上卦組成的卦,看事情內在的醞釀過程。", zhs: "取本卦二三四爻为下卦、三四五爻为上卦组成的卦,看事情内在的酝酿过程。", en: "The nuclear hexagram (lines 2-3-4 / 3-4-5) — the inner process behind the matter." },
  { term: "錯卦", zht: "六爻陰陽全部顛倒的卦,從對立面看同一件事。", zhs: "六爻阴阳全部颠倒的卦,从对立面看同一件事。", en: "The inverse hexagram (all lines flipped) — the same matter seen from the opposite side." },
  { term: "綜卦", zht: "把本卦上下顛倒的卦,看事情的另一種視角或下一階段。", zhs: "把本卦上下颠倒的卦,看事情的另一种视角或下一阶段。", en: "The reversed hexagram (turned upside down) — another angle or the next phase." },
  { term: "八卦", zht: "乾兌離震巽坎艮坤八個三爻符號,是六十四卦的組成單位,也各有自然意象(天澤火雷風水山地)。", zhs: "乾兑离震巽坎艮坤八个三爻符号,是六十四卦的组成单位,也各有自然意象(天泽火雷风水山地)。", en: "The eight trigrams — three-line building blocks of the hexagrams, each with a natural image." },
  { term: "十翼", zht: "孔子一系為《易》作的十篇傳:彖傳上下、象傳上下、繫辭上下、文言、說卦、序卦、雜卦。", zhs: "孔子一系为《易》作的十篇传:彖传上下、象传上下、系辞上下、文言、说卦、序卦、杂卦。", en: "The Ten Wings — ten classical commentaries on the Yi, traditionally attributed to Confucius' school." },
  { term: "文王卦序", zht: "相傳文王演易時定的 1–64 卦排列順序(乾一、坤二…既濟六十三、未濟六十四)。", zhs: "相传文王演易时定的 1–64 卦排列顺序(乾一、坤二…既济六十三、未济六十四)。", en: "The King Wen sequence — the traditional 1–64 ordering of the hexagrams." },
  { term: "問卦", zht: "帶著具體問題起卦。傳統講究:一事一占、心誠則靈,不義之問不占。", zhs: "带着具体问题起卦。传统讲究:一事一占、心诚则灵,不义之问不占。", en: "Consulting the Yi with a specific question. Tradition: one question per casting, asked sincerely." },
];

const GLOSSARY_MAP = new Map(YIJING_GLOSSARY.map((g) => [g.term, g]));

/** 查術語釋義 */
export function lookupGlossary(term: string): GlossaryTerm | undefined {
  return GLOSSARY_MAP.get(term);
}
