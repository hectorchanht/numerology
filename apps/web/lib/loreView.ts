/*
 * 數之學卡 / 數與和諧頁的純函數:黃道圓座標、latex 轉純文字、完全數表、畢氏音差。
 */

/** 黃經 → SVG 座標:白羊 0° 在左(九點鐘),逆時針遞增,與一般星盤同向。 */
export function wheelPoint(lon: number, r: number, c: number): { x: number; y: number } {
  const a = ((180 + lon) * Math.PI) / 180;
  return { x: c + r * Math.cos(a), y: c - r * Math.sin(a) };
}

/** 圓弧路徑(由 from 到 to 黃經,逆時針)。 */
export function arcPath(from: number, to: number, r: number, c: number): string {
  const a = wheelPoint(from, r, c), b = wheelPoint(to, r, c);
  const span = (((to - from) % 360) + 360) % 360;
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${r} ${r} 0 ${span > 180 ? 1 : 0} 0 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
}

/** Fideler 關係的 latex → 可讀純文字(只處理資料內出現的指令)。 */
export function latexPlain(s: string): string {
  return s
    .replace(/\\(?:t|d)?frac\{([^}]*)\}\{([^}]*)\}/g, "$1/$2")
    .replace(/\\sqrt\{([^}]*)\}/g, "√$1")
    .replace(/\\sum_\{([^}]*)\}\^\{([^}]*)\}/g, "Σ($1…$2)")
    .replace(/_\{60\}/g, "₆₀")
    .replace(/\^(\d)/g, (_, d: string) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(d)]!)
    .replace(/\\times/g, "×").replace(/\\approx/g, "≈").replace(/\\to/g, "→").replace(/\\pi/g, "π")
    .replace(/\\big\//g, "/").replace(/\\[,;]/g, " ")
    .replace(/\s+/g, " ").trim();
}

/** 頭六個完全數(歐幾里得:2^(p−1)(2^p − 1),2^p − 1 為質數)。 */
export function perfectNumbers(): { n: number; value: number; digits: number; last: number }[] {
  return [2, 3, 5, 7, 13, 17].map((p, i) => {
    const value = 2 ** (p - 1) * (2 ** p - 1);
    return { n: i + 1, value, digits: String(value).length, last: value % 10 };
  });
}

/** 畢氏音差 3¹² / 2¹⁹ 及其音分。 */
export function pythagoreanComma(): { ratio: number; cents: number } {
  const ratio = 3 ** 12 / 2 ** 19;
  return { ratio, cents: 1200 * Math.log2(ratio) };
}
