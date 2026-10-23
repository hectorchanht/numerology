"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, HTML_LANG, type TKey } from "@/lib/i18n";
import { go, useNav, type Tab } from "@/lib/nav";
import { Icon, type IconName } from "@/components/Icon";

/** 5 個主 tab(底部 tab bar 同桌面側欄共用)。 */
export const TAB_ITEMS: { tab: Tab; icon: IconName; labelKey: TKey }[] = [
  { tab: "home", icon: "home", labelKey: "tab.home" },
  { tab: "chart", icon: "grid", labelKey: "tab.chart" },
  { tab: "report", icon: "file", labelKey: "tab.report" },
  { tab: "fortune", icon: "trend", labelKey: "tab.fortune" },
  { tab: "history", icon: "history", labelKey: "tab.history" },
];

/** 底部 tab bar(全站):首頁內切畫面;子路由(/yijing 等)撳 tab 會返首頁對應畫面。 */
export function TabBar() {
  const { t, locale } = useLocale();
  const { tab } = useNav();
  const pathname = usePathname();
  const router = useRouter();
  const onHome = pathname === "/";

  // `<html lang>` 跟隨界面語言。
  useEffect(() => {
    document.documentElement.lang = HTML_LANG[locale];
  }, [locale]);

  return (
    <div className="tabbar">
      <nav aria-label={t("tab.aria")}>
        {TAB_ITEMS.map((it) => {
          const on = onHome && tab === it.tab;
          return (
            <button
              key={it.tab}
              type="button"
              className={on ? "on" : ""}
              aria-current={on ? "page" : undefined}
              onClick={() => {
                go(it.tab);
                if (!onHome) router.push("/");
              }}
            >
              <Icon name={it.icon} />
              {t(it.labelKey)}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
