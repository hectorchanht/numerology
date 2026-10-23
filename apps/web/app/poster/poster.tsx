"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { BirthInput } from "@numerology/engine";
import { useLocale } from "@/lib/i18n";
import { listReadings, type Reading } from "@/lib/history";
import { currentLuckStep } from "@/lib/ganzhi";
import { go } from "@/lib/nav";
import { yjT, yjFmt, type YijingLocale } from "@/lib/yijingStrings";

function p2(n: number): string {
  return String(n).padStart(2, "0");
}

function birthSummary(input: BirthInput, loc: YijingLocale): string {
  return `${input.year}-${p2(input.month)}-${p2(input.day)} ${p2(input.hour)}:${p2(input.minute ?? 0)} ${input.gender}`;
}

const PILLARS = ["year", "month", "day", "hour"] as const;
const PILLAR_IDS = {
  year: "poster.yearPillar",
  month: "poster.monthPillar",
  day: "poster.dayPillar",
  hour: "poster.hourPillar",
} as const;

export default function ChartPoster() {
  const { locale } = useLocale();
  const loc = locale as YijingLocale;
  const [reading, setReading] = useState<Reading | null | undefined>(undefined);

  useEffect(() => {
    listReadings()
      .then((rs) => setReading(rs[0] ?? null))
      .catch(() => setReading(null));
  }, []);

  const poster = useMemo(() => {
    if (!reading) return null;
    const chart = reading.chart;
    const soul = chart.ziwei.palaces.find((p) => p.isSoulPalace);
    const body = chart.ziwei.palaces.find((p) => p.isBodyPalace);
    const dayun = currentLuckStep(chart.bazi);
    return { chart, soul, body, dayun };
  }, [reading]);

  return (
    <>
      <style>{`
        .poster-wrap { max-width: 430px; margin: 0 auto; }
        .poster-paper {
          position: relative;
          background: var(--card);
          border-radius: 20px;
          padding: 24px 20px 20px;
          overflow: hidden;
        }
        .poster-v {
          writing-mode: vertical-rl; letter-spacing: 0.5em;
          color: var(--label-3); font-size: 13px; user-select: none;
        }
        .poster-seal {
          display: inline-grid; place-items: center;
          width: 52px; height: 52px;
          background: var(--accent); color: var(--on-accent);
          font-size: 26px; font-weight: 600;
          border-radius: 14px;
        }
        .poster-row { display: flex; gap: 12px; align-items: baseline; padding: 10px 0; border-bottom: 0.5px solid var(--sep); }
        .poster-row:last-child { border-bottom: none; }
        .poster-k { min-width: 4.2em; color: var(--label-2); font-size: 13px; }
        .poster-v2 { font-size: 16px; }
        .poster-h { color: var(--accent); font-size: 13px; letter-spacing: 0.04em; margin-bottom: 4px; }
        .poster-pillars { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 8px; }
        .poster-pillar { text-align: center; border-radius: 12px; padding: 12px 4px; background: var(--card-2); }
        .poster-pillar .gz { font-size: 24px; font-weight: 500; color: var(--label); }
        .poster-pillar .ss { font-size: 12px; color: var(--accent); margin-top: 2px; min-height: 1.2em; }
        .poster-pillar .lb { font-size: 11px; color: var(--label-3); margin-top: 2px; }
      `}</style>

      {/* .poster-layout:手機 display:contents;桌面左欄標題、右欄海報 */}
      <div className="poster-layout">
        <div className="masthead">
          <h1>{yjT("poster.title", loc)}</h1>
          <div className="sub">{yjT("poster.sub", loc)}</div>
        </div>

        <div className="poster-wrap">
          {reading === undefined && <p className="muted">…</p>}

          {reading === null && (
            <div className="card" style={{ textAlign: "center" }}>
              <p>{yjT("poster.empty", loc)}</p>
              <p className="muted">{yjT("poster.emptyHint", loc)}</p>
              <Link href="/" className="btn" onClick={() => go("home")}>
                {yjT("poster.goHome", loc)}
              </Link>
            </div>
          )}

          {poster && (
            <div className="poster-paper">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "0.04em" }}>
                    {yjT("poster.title", loc)}
                  </div>
                  <div className="muted" style={{ marginTop: "0.3rem" }}>
                    {yjFmt(yjT("poster.generatedAt", loc), {
                      date: new Date(reading!.updatedAt).toLocaleDateString(),
                    })}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.9rem", alignItems: "flex-start" }}>
                  <span className="poster-v" aria-hidden>
                    {loc === "en" ? "YI JING ACADEMY" : "易經學院"}
                  </span>
                  <span className="poster-seal" aria-hidden>
                    印
                  </span>
                </div>
              </div>

              <div style={{ marginTop: "1.3rem" }}>
                <div className="poster-row">
                  <span className="poster-k">{yjT("poster.birth", loc)}</span>
                  <span className="poster-v2">{birthSummary(poster.chart.input, loc)}</span>
                </div>
                {poster.chart.bazi.lunarDate && (
                  <div className="poster-row">
                    <span className="poster-k">{yjT("poster.lunar", loc)}</span>
                    <span className="poster-v2">{poster.chart.bazi.lunarDate}</span>
                  </div>
                )}
              </div>

              <div style={{ marginTop: "1.1rem" }}>
                <div className="poster-h">{yjT("poster.bazi", loc)}</div>
                <div className="poster-pillars">
                  {PILLARS.map((k) => {
                    const p = poster.chart.bazi.fourPillars[k];
                    return (
                      <div className="poster-pillar" key={k}>
                        <div className="gz">{p.ganZhi}</div>
                        <div className="ss">{p.shiShenGan || " "}</div>
                        <div className="lb">{yjT(PILLAR_IDS[k], loc)}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="poster-row" style={{ marginTop: "0.6rem" }}>
                  <span className="poster-k">{yjT("poster.daymaster", loc)}</span>
                  <span className="poster-v2" style={{ color: "var(--cinnabar)" }}>
                    {poster.chart.bazi.dayMaster}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: "1.1rem" }}>
                <div className="poster-h">{yjT("poster.ziwei", loc)}</div>
                {poster.soul && (
                  <div className="poster-row">
                    <span className="poster-k">{yjT("poster.soulPalace", loc)}</span>
                    <span className="poster-v2">
                      {poster.soul.name}
                      {` `}
                      <span className="muted" style={{ fontSize: "0.8rem" }}>
                        {yjT("poster.mainStars", loc)}:
                        {poster.soul.majorStars.map((s) => s.name).join(" ") || "—"}
                      </span>
                    </span>
                  </div>
                )}
                {poster.body && (
                  <div className="poster-row">
                    <span className="poster-k">{yjT("poster.bodyPalace", loc)}</span>
                    <span className="poster-v2">{poster.body.name}</span>
                  </div>
                )}
                {poster.dayun && (
                  <div className="poster-row">
                    <span className="poster-k">{yjT("poster.dayun", loc)}</span>
                    <span className="poster-v2">
                      {poster.dayun.ganZhi}
                      <span className="muted" style={{ fontSize: "0.8rem", marginLeft: "0.5rem" }}>
                        {poster.dayun.startAge}–{poster.dayun.endAge}
                        {loc === "en" ? " yrs" : loc === "zhs" ? " 岁" : " 歲"}
                      </span>
                    </span>
                  </div>
                )}
              </div>

              <p
                className="muted"
                style={{ textAlign: "center", marginTop: "1.4rem", marginBottom: 0, fontSize: "0.72rem" }}
              >
                {yjT("poster.disclaimer", loc)}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
