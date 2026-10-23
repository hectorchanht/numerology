"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { BirthInput, ChartResult, DaYunStep } from "@numerology/engine";
import { useLocale } from "@/lib/i18n";
import { listReadings, type Reading } from "@/lib/history";
import { yjT, yjFmt, type YijingLocale } from "@/lib/yijingStrings";

function p2(n: number): string {
  return String(n).padStart(2, "0");
}

function birthSummary(input: BirthInput, loc: YijingLocale): string {
  return `${input.year}-${p2(input.month)}-${p2(input.day)} ${p2(input.hour)}:${p2(input.minute ?? 0)} ${input.gender}`;
}

/** 虛歲近似:當年 - 出生年 + 1(大運起止用虛歲區間)。 */
function currentAge(input: BirthInput): number {
  return new Date().getFullYear() - input.year + 1;
}

function currentDayun(chart: ChartResult): DaYunStep | undefined {
  const age = currentAge(chart.input);
  return chart.bazi.daYun.find((d) => age >= d.startAge && age <= d.endAge);
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
    const dayun = currentDayun(chart);
    return { chart, soul, body, dayun };
  }, [reading]);

  return (
    <>
      <style>{`
        .poster-wrap { max-width: 480px; margin: 0 auto; }
        .poster-paper {
          position: relative;
          background:
            radial-gradient(90% 60% at 20% 10%, oklch(97% 0.02 85 / 0.7), transparent 60%),
            radial-gradient(70% 50% at 85% 80%, oklch(90% 0.03 75 / 0.5), transparent 60%),
            linear-gradient(175deg, oklch(97.5% 0.012 85), oklch(94% 0.02 80));
          border: 1px solid var(--line-strong);
          border-radius: 6px;
          padding: 1.8rem 1.4rem 1.4rem;
          box-shadow: 0 14px 40px oklch(40% 0.02 60 / 0.16);
          overflow: hidden;
        }
        .poster-paper::before {
          content: ""; position: absolute; inset: 8px;
          border: 1px solid oklch(64% 0.02 60 / 0.5);
          border-radius: 3px; pointer-events: none;
        }
        .poster-v {
          writing-mode: vertical-rl; letter-spacing: 0.5em;
          font-family: var(--serif); color: var(--ink-faint);
          font-size: 0.85rem; user-select: none;
        }
        .poster-seal {
          display: inline-grid; place-items: center;
          width: 3.2rem; height: 3.2rem;
          background: var(--cinnabar); color: var(--paper);
          font-family: var(--serif); font-size: 1.6rem;
          border-radius: 5px; transform: rotate(-4deg);
          box-shadow: 0 2px 0 oklch(40% 0.16 32), inset 0 0 6px oklch(100% 0 0 / 0.12);
        }
        .poster-row { display: flex; gap: 0.7rem; align-items: baseline; padding: 0.42rem 0; border-bottom: 1px dashed var(--line); }
        .poster-row:last-child { border-bottom: none; }
        .poster-k { min-width: 4.2em; color: var(--ink-faint); font-size: 0.8rem; letter-spacing: 0.12em; }
        .poster-v2 { font-family: var(--serif); font-size: 1.02rem; }
        .poster-pillars { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; margin-top: 0.6rem; }
        .poster-pillar {
          text-align: center; border: 1px solid var(--line);
          border-radius: 6px; padding: 0.55rem 0.2rem;
          background: oklch(99% 0.008 85 / 0.7);
        }
        .poster-pillar .gz { font-family: var(--serif); font-size: 1.45rem; color: var(--ink); }
        .poster-pillar .ss { font-size: 0.68rem; color: var(--cinnabar-soft); margin-top: 0.15rem; min-height: 1.1em; }
        .poster-pillar .lb { font-size: 0.66rem; color: var(--ink-faint); margin-top: 0.2rem; }
      `}</style>

      <div className="masthead" style={{ paddingTop: "1.2rem" }}>
        <h1 style={{ letterSpacing: "0.28em" }}>{yjT("poster.title", loc)}</h1>
        <div className="sub">{yjT("poster.sub", loc)}</div>
      </div>

      <div className="poster-wrap">
        {reading === undefined && <p className="muted">…</p>}

        {reading === null && (
          <div className="card" style={{ textAlign: "center" }}>
            <p>{yjT("poster.empty", loc)}</p>
            <p className="muted">{yjT("poster.emptyHint", loc)}</p>
            <Link href="/" className="btn" style={{ display: "inline-block", textDecoration: "none" }}>
              {yjT("poster.goHome", loc)}
            </Link>
          </div>
        )}

        {poster && (
          <div className="poster-paper">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: "1.9rem",
                    letterSpacing: "0.3em",
                    color: "var(--ink)",
                  }}
                >
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
              <div
                style={{
                  fontFamily: "var(--serif)",
                  color: "var(--cinnabar)",
                  letterSpacing: "0.2em",
                  fontSize: "0.95rem",
                  marginBottom: "0.2rem",
                }}
              >
                {yjT("poster.bazi", loc)}
              </div>
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
              <div
                style={{
                  fontFamily: "var(--serif)",
                  color: "var(--cinnabar)",
                  letterSpacing: "0.2em",
                  fontSize: "0.95rem",
                  marginBottom: "0.2rem",
                }}
              >
                {yjT("poster.ziwei", loc)}
              </div>
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
    </>
  );
}
