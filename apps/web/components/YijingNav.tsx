"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/i18n";
import { yjT } from "@/lib/yijingStrings";

const LINKS: { href: string; id: string }[] = [
  { href: "/", id: "nav.home" },
  { href: "/yijing", id: "nav.yijing" },
  { href: "/yijing/gua", id: "nav.gua" },
  { href: "/poster", id: "nav.poster" },
];

/** 頂部瘦導航:首頁 / 易經占卦 / 六十四卦 / 命盤海報,當前頁高亮。 */
export function YijingNav() {
  const { locale } = useLocale();
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
  return (
    <nav
      aria-label="site"
      style={{
        borderBottom: "1px solid var(--line)",
        background: "color-mix(in oklab, var(--surface) 88%, transparent)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        className="shell"
        style={{
          paddingTop: "0.45rem",
          paddingBottom: "0.45rem",
          display: "flex",
          gap: "0.25rem",
          alignItems: "center",
          overflowX: "auto",
        }}
      >
        <span
          aria-hidden
          style={{
            display: "inline-grid",
            placeItems: "center",
            width: "1.7rem",
            height: "1.7rem",
            background: "var(--cinnabar)",
            color: "var(--paper)",
            borderRadius: "4px",
            fontFamily: "var(--serif)",
            fontSize: "1rem",
            marginRight: "0.35rem",
            flex: "0 0 auto",
          }}
        >
          易
        </span>
        {LINKS.map((l) => {
          const active = isActive(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              style={{
                whiteSpace: "nowrap",
                fontSize: "0.85rem",
                letterSpacing: "0.05em",
                padding: "0.35rem 0.7rem",
                borderRadius: "999px",
                textDecoration: "none",
                color: active ? "var(--paper)" : "var(--ink-soft)",
                background: active ? "var(--cinnabar)" : "transparent",
              }}
            >
              {yjT(l.id, locale)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
