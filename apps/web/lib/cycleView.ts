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

/** 大六壬自訂起課時刻(datetime-local 值)→ 時刻;空白、格式不合或年份出 1900–2100 → null(退回出生課)。 */
export function parseLiurenAt(v: string): { year: number; month: number; day: number; hour: number; minute: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(v);
  if (!m || +m[1]! < 1900 || +m[1]! > 2100) return null;
  return { year: +m[1]!, month: +m[2]!, day: +m[3]!, hour: +m[4]!, minute: +m[5]! };
}
