import KANGXI_STROKES from "./kangxi-strokes.data.js";

/**
 * 查單字康熙筆畫(五格剖象用)。
 *
 * 口徑:康熙部首畫數 + 部外畫數(Unihan kRSUnicode 首值);
 * 「巡」按康熙字典巛部三畫取 6(非走部)。
 * 簡體輸入請先轉繁體再查;查無回傳 undefined,由調用方決定處理。
 */
export function kangxiStrokes(ch: string): number | undefined {
  return KANGXI_STROKES[ch];
}

/** 數據覆蓋字數(測試/診斷用)。 */
export function kangxiStrokesSize(): number {
  return Object.keys(KANGXI_STROKES).length;
}
