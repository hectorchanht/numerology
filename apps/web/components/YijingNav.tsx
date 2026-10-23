"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/i18n";
import { yjT } from "@/lib/yijingStrings";
import { Icon, type IconName } from "@/components/Icon";

/** 子頁連結(子頁頂部導航同桌面側欄共用)。 */
export const SUB_LINKS: { href: string; id: string; icon: IconName }[] = [
  { href: "/yijing", id: "nav.yijing", icon: "hex" },
  { href: "/yijing/meihua", id: "nav.meihua", icon: "hourglass" },
  { href: "/yijing/cases", id: "nav.cases", icon: "history" },
  { href: "/yijing/gua", id: "nav.gua", icon: "book" },
  { href: "/yijing/liuyao", id: "nav.liuyao", icon: "grid" },
  { href: "/yijing/academy", id: "nav.academy", icon: "bulb" },
  { href: "/poster", id: "nav.poster", icon: "image" },
];

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
