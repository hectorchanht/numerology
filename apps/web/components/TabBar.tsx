"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, LocaleSwitch, HTML_LANG, type TKey } from "@/lib/i18n";
import { go, useNav, type Tab } from "@/lib/nav";
import { SUB_GROUPS, type SubGroup } from "@/lib/navGroups";
import { yjT } from "@/lib/yijingStrings";
import { Icon, type IconName } from "@/components/Icon";
import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * 全站主導航單一清單(桌面側欄用呢份順序):起盤 / AI 解讀 / 學院(連結)/ 歷史。
 * 學院係 route 連結,唔係 tab screen,所以清單混合 tab 同 link 兩種 item。
 */
export type NavItem =
  | { kind: "tab"; tab: Tab; icon: IconName; labelKey: TKey }
  | { kind: "link"; href: string; icon: IconName; labelKey: TKey };

export const NAV_ITEMS: NavItem[] = [
  { kind: "tab", tab: "home", icon: "home", labelKey: "tab.home" },
  { kind: "tab", tab: "ai", icon: "spark", labelKey: "tab.ai" },
  { kind: "link", href: "/yijing/academy", icon: "bulb", labelKey: "tab.academy" },
  { kind: "tab", tab: "history", icon: "history", labelKey: "tab.history" },
];

/** 純 tab 版(舊 caller 兼容)。 */
export const TAB_ITEMS = NAV_ITEMS.filter(
  (it): it is Extract<NavItem, { kind: "tab" }> => it.kind === "tab",
);

/** 學苑組(SUB_GROUPS 內 labelId = nav.group.study)。 */
const STUDY_GROUP: SubGroup | undefined = SUB_GROUPS.find((g) => g.labelId === "nav.group.study");
/** 工具組:問卜 / 命理 + 海報尾段(學苑組歸學院 sheet,唔喺工具 sheet 重複)。 */
const TOOL_GROUPS: SubGroup[] = SUB_GROUPS.filter((g) => g.labelId !== "nav.group.study");

type SheetKind = "tools" | "academy";

/**
 * 手機底欄清單(可調:改呢份清單即改底欄)。
 * 起盤 / 解讀 = tab screen;工具 / 學院 = 彈出第二層 sheet,唔係 screen。
 */
export type MobileItem =
  | { kind: "tab"; tab: Tab; icon: IconName; labelKey: TKey }
  | { kind: "sheet"; sheet: SheetKind; icon: IconName; labelKey: TKey };

export const MOBILE_ITEMS: MobileItem[] = [
  { kind: "tab", tab: "home", icon: "home", labelKey: "tab.home" },
  { kind: "tab", tab: "ai", icon: "spark", labelKey: "tab.aiShort" },
  { kind: "sheet", sheet: "tools", icon: "grid", labelKey: "tab.tools" },
  { kind: "sheet", sheet: "academy", icon: "bulb", labelKey: "tab.academy" },
];

function GroupGrid({
  group,
  pathname,
  locale,
  onClose,
}: {
  group: SubGroup;
  pathname: string;
  locale: ReturnType<typeof useLocale>["locale"];
  onClose: () => void;
}) {
  return (
    <div className="more-grid">
      {group.links.map((l) => (
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
  );
}

/** 第二層 sheet:工具(全部工具分組 + 命盤/歷史/設定)/ 學院(學苑組連結)。 */
function NavSheet({ kind, onClose }: { kind: SheetKind; onClose: () => void }) {
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

  const title = kind === "tools" ? t("tab.tools") : yjT("nav.academy", locale);

  return (
    <div className="more-wrap" role="dialog" aria-modal="true" aria-label={title}>
      <div className="more-backdrop" onClick={onClose} />
      <div className="more-sheet">
        <div className="more-head">
          <span>{title}</span>
          <button type="button" className="icon-btn" aria-label={title} onClick={onClose}>
            <Icon name="chevDown" />
          </button>
        </div>

        {kind === "tools" ? (
          <>
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

            {TOOL_GROUPS.map((g, gi) => (
              <div key={g.labelId ?? `tail-${gi}`} className="more-group">
                {g.labelId && <div className="more-group-label">{yjT(g.labelId, locale)}</div>}
                <GroupGrid group={g} pathname={pathname} locale={locale} onClose={onClose} />
              </div>
            ))}

            <div className="more-foot">
              <LocaleSwitch />
              <ThemeToggle />
            </div>
          </>
        ) : (
          <>
            {STUDY_GROUP && (
              <div className="more-group">
                <GroupGrid group={STUDY_GROUP} pathname={pathname} locale={locale} onClose={onClose} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** 底部 tab bar(全站):主 item + 第二層 sheet;子路由撳 tab 會返首頁對應畫面。 */
export function TabBar() {
  const { t, locale } = useLocale();
  const { tab } = useNav();
  const pathname = usePathname();
  const router = useRouter();
  const onHome = pathname === "/";
  const [sheet, setSheet] = useState<SheetKind | null>(null);

  // `<html lang>` 跟隨界面語言。
  useEffect(() => {
    document.documentElement.lang = HTML_LANG[locale];
  }, [locale]);

  // 轉頁自動收起 sheet。
  useEffect(() => {
    setSheet(null);
  }, [pathname]);

  const academyOn = pathname === "/yijing/academy" || pathname.startsWith("/yijing/academy/");

  return (
    <>
      <div className="tabbar">
        <nav
          aria-label={t("tab.aria")}
          style={{ "--tab-count": MOBILE_ITEMS.length } as React.CSSProperties}
        >
          {MOBILE_ITEMS.map((it) => {
            if (it.kind === "tab") {
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
            }
            const on = sheet === it.sheet || (it.sheet === "academy" && academyOn);
            return (
              <button
                key={it.sheet}
                type="button"
                className={on ? "on" : ""}
                aria-expanded={sheet === it.sheet}
                onClick={() => setSheet((v) => (v === it.sheet ? null : it.sheet))}
              >
                <Icon name={it.icon} />
                {t(it.labelKey)}
              </button>
            );
          })}
        </nav>
      </div>
      {sheet && <NavSheet kind={sheet} onClose={() => setSheet(null)} />}
    </>
  );
}
