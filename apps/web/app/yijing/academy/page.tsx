"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ACADEMY_LESSONS, ACADEMY_TRACKS, loadProgress, type AcademyProgress } from "./lessons";
import { useLocale, useScript } from "@/lib/i18n";
import { yjT, type YijingLocale } from "@/lib/yijingStrings";
import { withTermHighlights } from "@/lib/highlightTerms";

/** 課程首頁:按卷分組的學習路線圖 + localStorage 進度。 */
export default function AcademyIndexPage() {
  const { locale } = useLocale();
  const { zT } = useScript();
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
        <p style={{ lineHeight: 1.9, margin: 0 }}>{withTermHighlights(yjT("academy.intro", loc))}</p>
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

      {/* 學習路線圖:按卷分組(根基 → 占卦實務 → 工具與專題),每卷一條時間線 */}
      {ACADEMY_TRACKS.map((track) => {
        const items = ACADEMY_LESSONS.map((l, i) => ({ l, i })).filter((x) => x.l.track === track.id);
        if (items.length === 0) return null;
        const trackDone = items.filter((x) => progress[x.l.id]?.done).length;
        return (
          <div key={track.id} style={{ marginTop: "2rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "0.7rem",
                flexWrap: "wrap",
                paddingBottom: "0.55rem",
                borderBottom: "1px solid var(--line)",
              }}
            >
              <span style={{ fontFamily: "var(--serif)", fontSize: "1.18rem", fontWeight: 700 }}>
                {zT(track.no)} · {zT(track.title)}
              </span>
              <span className="muted" style={{ fontSize: "0.9rem" }}>
                {zT(track.sub)}
              </span>
              <span className="muted" style={{ fontSize: "0.85rem", marginLeft: "auto" }}>
                {trackDone}/{items.length}
              </span>
            </div>

            <div style={{ position: "relative", marginTop: "1.4rem", paddingBottom: "0.4rem" }}>
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  left: "1.28rem",
                  top: "1.6rem",
                  bottom: "1.6rem",
                  width: "2px",
                  background: "var(--line)",
                }}
              />
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  left: "1.28rem",
                  top: "1.6rem",
                  width: "2px",
                  height: `calc(${(trackDone / items.length) * 100}% - 1.6rem)`,
                  background: "var(--cinnabar)",
                  transition: "height 0.4s",
                }}
              />
              {items.map(({ l, i }, j) => {
                const p = progress[l.id];
                const done = !!p?.done;
                const isCurrent =
                  !done && ACADEMY_LESSONS.slice(0, i).every((x) => progress[x.id]?.done);
                const last = j === items.length - 1;
                return (
                  <div
                    key={l.id}
                    style={{
                      position: "relative",
                      display: "flex",
                      gap: "1.1rem",
                      alignItems: "flex-start",
                      marginBottom: last ? 0 : "1.6rem",
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        display: "inline-grid",
                        placeItems: "center",
                        width: "2.6rem",
                        height: "2.6rem",
                        flex: "0 0 auto",
                        borderRadius: "50%",
                        border: done
                          ? "1px solid var(--cinnabar)"
                          : isCurrent
                            ? "2px solid var(--cinnabar)"
                            : "1px solid var(--line-strong)",
                        color: done ? "var(--paper)" : isCurrent ? "var(--cinnabar)" : "var(--ink-faint)",
                        background: done ? "var(--cinnabar)" : "var(--paper)",
                        fontFamily: "var(--serif)",
                        fontSize: "1.1rem",
                        fontWeight: isCurrent ? 700 : 400,
                        boxShadow: isCurrent ? "0 0 0 4px oklch(from var(--cinnabar) l c h / 0.15)" : "none",
                        zIndex: 1,
                      }}
                    >
                      {done ? "✓" : l.index}
                    </span>
                    <Link
                      href={`/yijing/academy/${l.id}`}
                      style={{ textDecoration: "none", color: "inherit", display: "block", flex: 1 }}
                    >
                      <div
                        className="card"
                        style={{
                          margin: 0,
                          borderColor: isCurrent ? "var(--cinnabar-soft)" : undefined,
                          opacity: !done && !isCurrent ? 0.75 : 1,
                        }}
                      >
                        <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{zT(l.title)}</div>
                            <div className="muted" style={{ marginTop: "0.25rem" }}>
                              {zT(l.sub)} · {yjT("academy.minutes", loc).replace("{n}", String(l.minutes))}
                              {p?.done &&
                                ` · ${yjT("academy.best", loc).replace("{s}", String(p.best)).replace("{t}", String(p.total))}`}
                            </div>
                          </div>
                          <span aria-hidden style={{ color: "var(--ink-faint)", flex: "0 0 auto" }}>
                            →
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <p className="muted" style={{ marginTop: "1rem" }}>
        {yjT("academy.localNote", loc)}
      </p>
    </>
  );
}
