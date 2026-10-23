"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ACADEMY_LESSONS, loadProgress, type AcademyProgress } from "./lessons";
import { useLocale } from "@/lib/i18n";
import { yjT, type YijingLocale } from "@/lib/yijingStrings";

/** 課程首頁:四課列表 + localStorage 進度。 */
export default function AcademyIndexPage() {
  const { locale } = useLocale();
  const loc = locale as YijingLocale;
  const [progress, setProgress] = useState<AcademyProgress>({});

  useEffect(() => {
    setProgress(loadProgress());
    const onFocus = () => setProgress(loadProgress());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const doneCount = ACADEMY_LESSONS.filter((l) => progress[l.id]?.done).length;

  return (
    <>
      <div className="masthead" style={{ paddingTop: "1.2rem" }}>
        <h1 style={{ letterSpacing: "0.28em" }}>{yjT("academy.title", loc)}</h1>
        <div className="sub">{yjT("academy.sub", loc)}</div>
      </div>

      <div className="card">
        <p style={{ lineHeight: 1.9, margin: 0 }}>{yjT("academy.intro", loc)}</p>
        <p className="muted" style={{ marginTop: "0.6rem", marginBottom: 0 }}>
          {yjT("academy.progress", loc)
            .replace("{d}", String(doneCount))
            .replace("{t}", String(ACADEMY_LESSONS.length))}
        </p>
        <div
          style={{
            height: "6px",
            borderRadius: "3px",
            background: "var(--line)",
            marginTop: "0.5rem",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${(doneCount / ACADEMY_LESSONS.length) * 100}%`,
              height: "100%",
              background: "var(--cinnabar)",
              transition: "width 0.4s",
            }}
          />
        </div>
      </div>

      {ACADEMY_LESSONS.map((l) => {
        const p = progress[l.id];
        return (
          <Link
            key={l.id}
            href={`/yijing/academy/${l.id}`}
            style={{ textDecoration: "none", color: "inherit", display: "block" }}
          >
            <div className="card" style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <span
                aria-hidden
                style={{
                  display: "inline-grid",
                  placeItems: "center",
                  width: "2.6rem",
                  height: "2.6rem",
                  flex: "0 0 auto",
                  borderRadius: "50%",
                  border: "1px solid var(--cinnabar-soft)",
                  color: p?.done ? "var(--paper)" : "var(--cinnabar)",
                  background: p?.done ? "var(--cinnabar)" : "transparent",
                  fontFamily: "var(--serif)",
                  fontSize: "1.1rem",
                }}
              >
                {p?.done ? "✓" : l.index}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{l.title}</div>
                <div className="muted">
                  {l.sub} · {yjT("academy.minutes", loc).replace("{n}", String(l.minutes))}
                  {p?.done &&
                    ` · ${yjT("academy.best", loc).replace("{s}", String(p.best)).replace("{t}", String(p.total))}`}
                </div>
              </div>
              <span aria-hidden style={{ color: "var(--ink-faint)" }}>
                →
              </span>
            </div>
          </Link>
        );
      })}

      <p className="muted" style={{ marginTop: "1rem" }}>
        {yjT("academy.localNote", loc)}
      </p>
    </>
  );
}
