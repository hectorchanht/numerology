"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/i18n";
import { yjT } from "@/lib/yijingStrings";
import type { SubLink } from "@/lib/navGroups";
import { Icon } from "@/components/Icon";

/**
 * 同組頁面共用分頁 strip:一組相近頁面(同一功能拆開幾版)喺頁頂以 chip tabs 呈現,
 * 撳 chip 即去姊妹頁,當前頁高亮。資料源係 lib/navGroups 的單一清單(CASTING_TABS / STUDY_TABS),
 * 各頁唔好自己複製一份連結。
 * 高亮規則:pathname 等於 href 或係 href 的子路徑;多條命中時取最長 href
 * (例如 /yijing 係 /yijing/meihua 的前綴,但身在 meihua 時要高亮 meihua 而非 /yijing)。
 */
export function GroupTabs({ links, label }: { links: SubLink[]; label: string }) {
  const { locale } = useLocale();
  const pathname = usePathname();

  const activeHref = links
    .filter((l) => pathname === l.href || pathname.startsWith(`${l.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav className="strip group-tabs" aria-label={label}>
      {links.map((l) => {
        const on = l.href === activeHref;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`chip${on ? " on" : ""}`}
            aria-current={on ? "page" : undefined}
          >
            <Icon name={l.icon} small />
            {yjT(l.id, locale)}
          </Link>
        );
      })}
    </nav>
  );
}
