"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, LocaleSwitch } from "@/lib/i18n";
import { go, useNav, type Screen } from "@/lib/nav";
import { yjT } from "@/lib/yijingStrings";
import { Icon } from "@/components/Icon";
import { NAV_ITEMS } from "@/components/TabBar";
import { SUB_GROUPS } from "@/lib/navGroups";
import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * 桌面(≥1024px)左側欄:logo + 主導航(起盤/命盤/AI 解讀/學院/歷史)+ 子頁工具 + 設定/主題。
 * 學院已升上主導航,下層 SUB_GROUPS 渲染時濾走學院連結避免重複(資料仍以 navGroups 為單一來源)。
 * 手機/平板由 CSS 隱藏(仍用底部 tab bar),所以兩邊共用同一套 nav store 同 i18n。
 */
export function SideNav() {
  const { t, locale } = useLocale();
  const { screen, tab } = useNav();
  const pathname = usePathname();
  const router = useRouter();
  const onHome = pathname === "/";

  const open = (s: Screen) => {
    go(s);
    if (!onHome) router.push("/");
  };

  return (
    <aside className="side">
      <div className="side-foot">
        <button
          type="button"
          className="icon-btn"
          aria-label={t("nav.settings")}
          onClick={() => open("settings")}
        >
          <Icon name="gear" />
        </button>
        {/* 語言切換排喺主題切換之前 */}
        <LocaleSwitch />
        <ThemeToggle />
      </div>

      <div className="side-brand">
        <img className="logo logo-dark" src="/logo.png" width={32} height={32} alt="" aria-hidden="true" />
        <img className="logo logo-light" src="/logo-light.png" width={32} height={32} alt="" aria-hidden="true" />
        <div>
          <div className="side-title">{t("app.title")}</div>
          <div className="side-sub">{t("app.subtitle")}</div>
        </div>
      </div>

      <nav className="side-nav" aria-label={t("tab.aria")}>
        {NAV_ITEMS.map((it) => {
          if (it.kind === "link") {
            const on = pathname === it.href || pathname.startsWith(`${it.href}/`);
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`side-item${on ? " on" : ""}`}
                aria-current={on ? "page" : undefined}
              >
                <Icon name={it.icon} />
                {t(it.labelKey)}
              </Link>
            );
          }
          const on = onHome && screen !== "settings" && tab === it.tab;
          return (
            <button
              key={it.tab}
              type="button"
              className={`side-item${on ? " on" : ""}`}
              aria-current={on ? "page" : undefined}
              onClick={() => open(it.tab)}
            >
              <Icon name={it.icon} />
              {t(it.labelKey)}
            </button>
          );
        })}

        <div className="side-sep" role="separator" />

        {SUB_GROUPS.map((g, gi) => (
          <div key={g.labelId ?? `tail-${gi}`}>
            {g.labelId && <div className="side-group">{yjT(g.labelId, locale)}</div>}
            {g.links.filter((l) => l.href !== "/yijing/academy").map((l) => {
              const on = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`side-item${on ? " on" : ""}`}
                  aria-current={on ? "page" : undefined}
                >
                  <Icon name={l.icon} />
                  {yjT(l.id, locale)}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

    </aside>
  );
}
