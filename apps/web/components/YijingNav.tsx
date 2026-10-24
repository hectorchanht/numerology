"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/i18n";
import { yjT } from "@/lib/yijingStrings";
import { Icon, type IconName } from "@/components/Icon";

export interface SubLink {
  href: string;
  id: string;
  icon: IconName;
}

export interface SubGroup {
  /** 組名 yjT id;null = 唔分組(尾段)。 */
  labelId: string | null;
  links: SubLink[];
}

/**
 * 子頁連結(子頁頂部導航同桌面側欄共用),按用家意圖分組。
 * 桌面側欄顯示組名;頂部橫向導航保持平鋪(用 SUB_LINKS)。
 */
export const SUB_GROUPS: SubGroup[] = [
  {
    labelId: "nav.group.divine",
    links: [
      { href: "/yijing", id: "nav.yijing", icon: "hex" },
      { href: "/yijing/meihua", id: "nav.meihua", icon: "hourglass" },
      { href: "/yijing/liuyao", id: "nav.liuyao", icon: "grid" },
      { href: "/qimen", id: "nav.qimen", icon: "compass" },
    ],
  },
  {
    labelId: "nav.group.destiny",
    links: [
      { href: "/name", id: "nav.name", icon: "user" },
      { href: "/hepan", id: "nav.hepan", icon: "heart" },
      { href: "/fengshui", id: "nav.fengshui", icon: "pin" },
      { href: "/daily", id: "nav.daily", icon: "sun" },
    ],
  },
  {
    labelId: "nav.group.study",
    links: [
      { href: "/yijing/academy", id: "nav.academy", icon: "bulb" },
      { href: "/yijing/gua", id: "nav.gua", icon: "book" },
      { href: "/yijing/cases", id: "nav.cases", icon: "history" },
    ],
  },
  {
    labelId: null,
    links: [
      { href: "/yijing/history", id: "nav.yijingHistory", icon: "rewind" },
      { href: "/poster", id: "nav.poster", icon: "image" },
    ],
  },
];

/** 平鋪版(頂部橫向導航用)。 */
export const SUB_LINKS: SubLink[] = SUB_GROUPS.flatMap((g) => g.links);

/** 子頁頂部導航:返回首頁 + 易經占卦 / 六十四卦 / 命盤海報(橫向捲動),當前頁高亮。首頁唔顯示(有 tab bar)。 */
export function YijingNav() {
  const { locale } = useLocale();
  const pathname = usePathname();
  if (pathname === "/") return null;
  return (
    <nav aria-label="site" className="subnav">
      <Link href="/" className="icon-btn lead" aria-label={yjT("nav.home", locale)}>
        <Icon name="back" />
      </Link>
      <div className="strip">
        {SUB_LINKS.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={`chip${active ? " on" : ""}`}
            >
              <Icon name={l.icon} small />
              {yjT(l.id, locale)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
