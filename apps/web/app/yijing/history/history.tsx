"use client";

import { useLocale } from "@/lib/i18n";
import { yjT, type YijingLocale } from "@/lib/yijingStrings";
import { YijingHistoryPanel } from "@/components/YijingHistoryPanel";

/**
 * /yijing/history route:標題 + 共用列表本體(components/YijingHistoryPanel)。
 * 首頁「歷史」版的占卦歷史 tab 用同一個 panel,唔好喺度複製列表邏輯。
 */
export default function YijingHistoryList() {
  const { locale } = useLocale();
  const loc = locale as YijingLocale;

  return (
    <>
      <div className="masthead">
        <h1>{yjT("yijing.hist.title", loc)}</h1>
        <div className="sub">{yjT("yijing.hist.sub", loc)}</div>
      </div>

      <YijingHistoryPanel />
    </>
  );
}
