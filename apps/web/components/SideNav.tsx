"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, LocaleSwitch } from "@/lib/i18n";
import { go, useNav, type Screen } from "@/lib/nav";
import { yjT } from "@/lib/yijingStrings";
import { Icon } from "@/components/Icon";
import { TAB_ITEMS } from "@/components/TabBar";
import { SUB_LINKS } from "@/components/YijingNav";
import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * 桌面(≥1024px)左側欄:logo + 5 個主 tab + 子頁工具 + 設定/主題。
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
      <div className="side-brand">
        <img className="logo logo-dark" src="/logo.png" width={32} height={32} alt="" aria-hidden="true" />
        <img className="logo logo-light" src="/logo-light.png" width={32} height={32} alt="" aria-hidden="true" />
        <div>
          <div className="side-title">{t("app.title")}</div>
          <div className="side-sub">{t("app.subtitle")}</div>
        </div>
      </div>

      <nav className="side-nav" aria-label={t("tab.aria")}>
        {TAB_ITEMS.map((it) => {
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

        {SUB_LINKS.map((l) => {
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
      </nav>

      <div className="side-foot">
        <button
          type="button"
          className={`side-item${onHome && screen === "settings" ? " on" : ""}`}
          aria-current={onHome && screen === "settings" ? "page" : undefined}
          onClick={() => open("settings")}
        >
          <Icon name="gear" />
          {t("nav.settings")}
        </button>
        {/* 語言切換排喺主題切換之前 */}
        <LocaleSwitch />
        <ThemeToggle />
      </div>
    </aside>
  );
}
