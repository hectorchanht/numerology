import type { MayaResult, TaixuanResult } from "@numerology/engine";

/* ── 時間週期卡的格位(純函數,供測試) ── */

/** 太玄 81 首排成 9×9:首 n 在 row ⌊(n−1)/9⌋、col (n−1) mod 9。踦、嬴不在 81 首內 → null。 */
export function taixuanGrid(r: Pick<TaixuanResult, "head" | "zan" | "extra">): { head: number; zan: number; row: number; col: number } | null {
  if (r.head == null || r.zan == null || r.extra) return null;
  return { head: r.head, zan: r.zan, row: Math.floor((r.head - 1) / 9), col: (r.head - 1) % 9 };
}

/** Tzolk'in 13 × 20:row = 數字 − 1,col = 日名序(0 = Imix … 19 = Ajaw)。 */
export function tzolkinCell(r: Pick<MayaResult, "tzolkin">): { row: number; col: number } {
  return { row: r.tzolkin.number - 1, col: r.tzolkin.dayIndex };
}
