/**
 * 易經起卦引擎(純函數,零依賴):三錢起卦 + 本卦/變卦/互卦/錯卦/綜卦推導。
 *
 * 八卦查表(TRIGRAM)與文王卦序表(GUAMAP)移植自 crane1102/iching-llm (MIT)
 * backend/iching_coin.py;字形統一為繁體(兌/離)。
 * 卦序數字對應 packages/knowledge 的六十四卦庫(getHexagram)。
 */

/** 單爻錢值:6 老陰(動) / 7 少陽 / 8 少陰 / 9 老陽(動) */
export type CoinLine = 6 | 7 | 8 | 9;

export type TrigramKey = "乾" | "兌" | "離" | "震" | "巽" | "坎" | "艮" | "坤";

/** 起卦結果(爻由下而上) */
export interface CastResult {
  /** 六爻錢值,由下而上 */
  lines: CoinLine[];
  /** 本卦文王卦序 1–64 */
  hexagram: number;
  /** 動爻位置 1–6(由下而上) */
  changing: number[];
  /** 變卦卦序;無動爻則為 null */
  changed: number | null;
  /** 互卦卦序(二三四爻為下卦、三四五爻為上卦) */
  hu: number;
  /** 錯卦卦序(六爻陰陽全反) */
  cuo: number;
  /** 綜卦卦序(上下顛倒) */
  zong: number;
}

/* 三爻(由下而上 bits) → 卦名 */
const TRIGRAM: Record<string, TrigramKey> = {
  "111": "乾", "110": "兌", "101": "離", "100": "震",
  "011": "巽", "010": "坎", "001": "艮", "000": "坤",
};

/* (上卦, 下卦) → 文王卦序 1–64 */
const GUAMAP: Record<string, number> = {
  "乾,乾": 1,
  "坤,坤": 2,
  "坎,震": 3,
  "艮,坎": 4,
  "坎,乾": 5,
  "乾,坎": 6,
  "坤,坎": 7,
  "坎,坤": 8,
  "巽,乾": 9,
  "乾,兌": 10,
  "坤,乾": 11,
  "乾,坤": 12,
  "乾,離": 13,
  "離,乾": 14,
  "坤,艮": 15,
  "震,坤": 16,
  "兌,震": 17,
  "艮,巽": 18,
  "坤,兌": 19,
  "巽,坤": 20,
  "離,震": 21,
  "艮,離": 22,
  "艮,坤": 23,
  "坤,震": 24,
  "乾,震": 25,
  "艮,乾": 26,
  "艮,震": 27,
  "兌,巽": 28,
  "坎,坎": 29,
  "離,離": 30,
  "兌,艮": 31,
  "震,巽": 32,
  "乾,艮": 33,
  "震,乾": 34,
  "離,坤": 35,
  "坤,離": 36,
  "巽,離": 37,
  "離,兌": 38,
  "坎,艮": 39,
  "震,坎": 40,
  "艮,兌": 41,
  "巽,震": 42,
  "兌,乾": 43,
  "乾,巽": 44,
  "兌,坤": 45,
  "坤,巽": 46,
  "兌,坎": 47,
  "坎,巽": 48,
  "兌,離": 49,
  "離,巽": 50,
  "震,震": 51,
  "艮,艮": 52,
  "巽,艮": 53,
  "震,兌": 54,
  "震,離": 55,
  "離,艮": 56,
  "巽,巽": 57,
  "兌,兌": 58,
  "巽,坎": 59,
  "坎,兌": 60,
  "巽,兌": 61,
  "震,艮": 62,
  "坎,離": 63,
  "離,坎": 64,
};

function trigramOf(bits: number[]): TrigramKey {
  const t = TRIGRAM[bits.join("")];
  if (!t) throw new Error(`無法辨識三爻: ${bits.join("")}`);
  return t;
}

/** 三爻 bits(由下而上,1=陽/非零亦視為陽) → 卦名(供六爻納甲等模組用)。 */
export function trigramOfBits(bits: readonly number[]): TrigramKey {
  return trigramOf(bits.map((b) => (b ? 1 : 0)));
}

function numberOf(upper: TrigramKey, lower: TrigramKey): number {
  const n = GUAMAP[`${upper},${lower}`];
  if (!n) throw new Error(`查無卦序: 上${upper}下${lower}`);
  return n;
}

/** 錢值/0-1 → 陽(1)/陰(0) */
function toBit(v: number): number {
  if (v === 7 || v === 9 || v === 1) return 1;
  if (v === 6 || v === 8 || v === 0) return 0;
  throw new Error(`非法爻值 ${v}(須為 6/7/8/9 或 0/1)`);
}

/** 安全取 bits(noUncheckedIndexedAccess 下 bits[i] 為 number|undefined) */
function bit(bits: number[], i: number): number {
  const v = bits[i];
  if (v === undefined) throw new Error(`爻索引 ${i} 越界`);
  return v;
}

/**
 * 三錢起卦:每爻擲三枚錢,字=3/背=2,和數 6–9。
 * @param rng [0,1) 隨機源,預設 Math.random
 */
export function tossCoins(rng: () => number = Math.random): CoinLine[] {
  const lines: CoinLine[] = [];
  for (let i = 0; i < 6; i++) {
    let sum = 0;
    for (let c = 0; c < 3; c++) sum += rng() < 0.5 ? 2 : 3;
    lines.push(sum as CoinLine);
  }
  return lines;
}

/** 由六爻推導本卦/變卦/互卦/錯卦/綜卦 */
export function castYijing(lines: readonly number[]): CastResult {
  if (lines.length !== 6) throw new Error(`起卦須為六爻,收到 ${lines.length} 爻`);
  const bits = lines.map(toBit);
  const lower = trigramOf(bits.slice(0, 3));
  const upper = trigramOf(bits.slice(3, 6));
  const hexagram = numberOf(upper, lower);

  const changing: number[] = [];
  lines.forEach((v, i) => {
    if (v === 6 || v === 9) changing.push(i + 1);
  });

  // 變卦:動爻翻轉
  let changed: number | null = null;
  if (changing.length > 0) {
    const cb = bits.map((b, i) => (changing.includes(i + 1) ? 1 - b : b));
    changed = numberOf(trigramOf(cb.slice(3, 6)), trigramOf(cb.slice(0, 3)));
  }

  // 互卦:下卦=2-3-4 爻,上卦=3-4-5 爻
  const huLower = trigramOf([bit(bits, 1), bit(bits, 2), bit(bits, 3)]);
  const huUpper = trigramOf([bit(bits, 2), bit(bits, 3), bit(bits, 4)]);
  const hu = numberOf(huUpper, huLower);

  // 錯卦:陰陽全反
  const cuoBits = bits.map((b) => 1 - b);
  const cuo = numberOf(trigramOf(cuoBits.slice(3, 6)), trigramOf(cuoBits.slice(0, 3)));

  // 綜卦:上下顛倒
  const rev = [...bits].reverse();
  const zong = numberOf(trigramOf(rev.slice(3, 6)), trigramOf(rev.slice(0, 3)));

  return {
    lines: lines.map((v) => v as CoinLine),
    hexagram,
    changing,
    changed,
    hu,
    cuo,
    zong,
  };
}

/** 便捷:隨機起卦一次 */
export function divine(rng?: () => number): CastResult {
  return castYijing(tossCoins(rng));
}
