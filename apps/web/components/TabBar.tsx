"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, LocaleSwitch, HTML_LANG, type TKey } from "@/lib/i18n";
import { go, useNav, type Tab } from "@/lib/nav";
import { SUB_GROUPS } from "@/lib/navGroups";
import { yjT } from "@/lib/yijingStrings";
import { Icon, type IconName } from "@/components/Icon";
import { ThemeToggle } from "@/components/ThemeToggle";

/** 5 個主 tab(底部 tab bar 同桌面側欄共用)。 */
export const TAB_ITEMS: { tab: Tab; icon: IconName; labelKey: TKey }[] = [
  { tab: "home", icon: "home", labelKey: "tab.home" },
  { tab: "chart", icon: "grid", labelKey: "tab.chart" },
  { tab: "report", icon: "file", labelKey: "tab.report" },
  { tab: "fortune", icon: "trend", labelKey: "tab.fortune" },
  { tab: "history", icon: "history", labelKey: "tab.history" },
];

/** 手機底部「更多」sheet:全部工具(分組)+ 歷史 + 設定 + 語言/主題。任何頁面兩下到達任何工具。 */
function MoreSheet({ onClose }: { onClose: () => void }) {
  const { t, locale } = useLocale();
  const { tab } = useNav();
  const pathname = usePathname();
  const router = useRouter();
  const onHome = pathname === "/";

  const goTab = (target: Tab | "settings") => {
    go(target);
    if (!onHome) router.push("/");
    onClose();
  };

  return (
    <div className="more-wrap" role="dialog" aria-modal="true" aria-label={t("tab.more")}>
      <div className="more-backdrop" onClick={onClose} />
      <div className="more-sheet">
        <div className="more-head">
          <span>{t("tab.more")}</span>
          <button type="button" className="icon-btn" aria-label={t("tab.more")} onClick={onClose}>
            <Icon name="chevDown" />
          </button>
        </div>

        <div className="more-rows">
          <button
            type="button"
            className={`more-row${onHome && tab === "history" ? " on" : ""}`}
            onClick={() => goTab("history")}
          >
            <Icon name="history" />
            {t("tab.history")}
          </button>
          <button type="button" className="more-row" onClick={() => goTab("settings")}>
            <Icon name="gear" />
            {t("nav.settings")}
          </button>
        </div>

        {SUB_GROUPS.map((g, gi) => (
          <div key={g.labelId ?? `tail-${gi}`} className="more-group">
            {g.labelId && <div className="more-group-label">{yjT(g.labelId, locale)}</div>}
            <div className="more-grid">
              {g.links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`more-item${pathname === l.href ? " on" : ""}`}
                  aria-current={pathname === l.href ? "page" : undefined}
                  onClick={onClose}
                >
                  <Icon name={l.icon} />
                  {yjT(l.id, locale)}
                </Link>
              ))}
            </div>
          </div>
        ))}

        <div className="more-foot">
          <LocaleSwitch />
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

/** 底部 tab bar(全站):4 個主 tab + 「更多」;子路由撳 tab 會返首頁對應畫面。 */
export function TabBar() {
  const { t, locale } = useLocale();
  const { tab } = useNav();
  const pathname = usePathname();
  const router = useRouter();
  const onHome = pathname === "/";
  const [moreOpen, setMoreOpen] = useState(false);

  // `<html lang>` 跟隨界面語言。
  useEffect(() => {
    document.documentElement.lang = HTML_LANG[locale];
  }, [locale]);

  // 轉頁自動收起 sheet。
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  return (
    <>
      <div className="tabbar">
        <nav aria-label={t("tab.aria")}>
          {TAB_ITEMS.slice(0, 4).map((it) => {
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
          <button
            type="button"
            className={moreOpen ? "on" : ""}
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen((v) => !v)}
          >
            <Icon name="dots" />
            {t("tab.more")}
          </button>
        </nav>
      </div>
      {moreOpen && <MoreSheet onClose={() => setMoreOpen(false)} />}
    </>
  );
}
