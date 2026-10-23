import type { ReactNode } from "react";

/**
 * 全站統一 padding 佈局:包住頁面內容,保證 safe-area 頂部 + 橫向 --pad +
 * tab bar 底部位喺所有頁面一致(經 globals.css `.shell`)。
 *
 * 用法:
 * - 成組路由:喺該組嘅 layout.tsx 包一次(例:app/yijing/layout.tsx),組內所有頁自動繼承。
 * - 單頁:直接包住內容(例:app/poster/page.tsx)。
 * 唔好喺已經被 PageShell(或 yijing layout)包住嘅頁面再包多層,padding 會疊加。
 */
export function PageShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`shell${className ? ` ${className}` : ""}`}>{children}</div>;
}
