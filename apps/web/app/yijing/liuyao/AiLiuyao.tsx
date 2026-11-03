"use client";

import type { YaoValue } from "@numerology/engine";
import type { YijingLocale } from "@/lib/yijingStrings";
import { AiInterpret } from "../AiInterpret";

/**
 * 六爻納甲 AI 解讀:走 /api/yijing/liuyao-interpret,UI 狀態(讀取 / 額度卡 / 錯誤重試)同 AiInterpret 共用。
 * 不送用戶問題,純按納甲盤解讀。
 */
export function AiLiuyao({ lines, date, locale }: { lines: YaoValue[]; date: string; locale: YijingLocale }) {
  return <AiInterpret endpoint="/api/yijing/liuyao-interpret" body={{ lines, date }} locale={locale} />;
}
