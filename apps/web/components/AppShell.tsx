"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { PageShell } from "@/components/PageShell";

/**
 * 全站共同內容 shell(由 root layout 統一套用):
 * 所有頁面經 PageShell 取得一致的 safe-area / 橫向 padding / tab bar 底距,
 * 頁面本身唔再逐頁包。唯一例外:首頁 "/" 係 tab app,自有全幅佈局,唔套 shell。
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/") return <>{children}</>;
  return <PageShell>{children}</PageShell>;
}
