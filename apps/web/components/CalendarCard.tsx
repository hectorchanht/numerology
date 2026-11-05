"use client";

import { useMemo } from "react";
import {
  castEgyptian, castEphemeris, castJyotish, castMetonic,
  type ChartResult, type EgyptianResult, type JyotishResult, type MetonicResult,
} from "@numerology/engine";
import type { Cite } from "@numerology/knowledge";
import { useLocale, useScript, type TKey } from "@/lib/i18n";
import { CitePop } from "@/components/CrossSystemCard";

/*
 * 曆法三系卡:Jyotish 宿位與 Vimshottari(與八字大運並列時間條)、埃及民用曆與 face、十九年週期。
 * 全部由引擎確定性計算,零 AI;舊歷史紀錄只存 chart,於此即場重算。
 */

function Meta({ tier, cites }: { tier: string; cites: Cite[] }) {
  const { t } = useLocale();
  return (
    <div className="xs-meta">
      <span className={`xs-tier tier-${tier}`}>{t(`cross.tier.${tier}` as TKey)}</span>
      {cites.map((c, i) => <CitePop key={i} cite={c} />)}
    </div>
  );
}

function Steps({ steps }: { steps: string[] }) {
  const { t } = useLocale();
  const { z } = useScript();
  return (
    <details className="xs-steps">
      <summary>{t("cross.steps")}</summary>
      <ol>{steps.map((s, i) => <li key={i}>{z(s)}</li>)}</ol>
    </details>
  );
}

const W = 343, L = 70, SPAN = 100;

/** 公曆年時間條:上 Vimshottari、下八字大運,豎線標今年。 */
function Timeline({ r, chart }: { r: JyotishResult; chart: ChartResult }) {
  const { t, locale } = useLocale();
  const { z } = useScript();
  const short = (s: string) => (locale === "en" ? s.slice(0, 2) : s[0]!);
  const y0 = chart.input.year;
  const x = (y: number) => L + ((y - y0) / SPAN) * (W - L - 4);
  const yearOf = (iso: string) => { const d = new Date(iso); return d.getUTCFullYear() + d.getUTCMonth() / 12 + (d.getUTCDate() - 1) / 365; };
  const dashas = r.dashas.map((d) => ({ ...d, a: yearOf(d.start), b: yearOf(d.end) })).filter((d) => d.a < y0 + SPAN);
  const bazi = chart.bazi.daYun.filter((d) => d.ganZhi).map((d) => ({ g: d.ganZhi, a: d.startYear, b: d.startYear + d.endAge - d.startAge + 1 })).filter((d) => d.a < y0 + SPAN);
  const now = new Date().getFullYear();
  const label = t("cal.timelineAria", {
    d: dashas.map((d) => `${t(`cross.planet.${d.lord}` as TKey)} ${Math.floor(d.a)}–${Math.floor(d.b)}`).join(", "),
    b: bazi.map((d) => `${z(d.g)} ${d.a}–${d.b - 1}`).join(", "),
  });
  const row = (y: number, items: { key: string; a: number; b: number; text: string }[]) => items.map((it, i) => {
    const a = x(Math.max(it.a, y0)), b = x(Math.min(it.b, y0 + SPAN));
    return (
      <g key={it.key}>
        <rect className={`cal-seg cal-seg-${i % 2}`} x={a} y={y} width={Math.max(0, b - a - 1)} height={22} rx={2} />
        {b - a > 18 ? <text className="cal-seg-txt" x={(a + b) / 2} y={y + 11} fontSize={10}>{it.text}</text> : null}
      </g>
    );
  });
  return (
    <svg className="xs-grid cal-timeline" viewBox={`0 0 ${W} 92`} role="img" aria-label={label}>
      <title>{label}</title>
      <text className="xs-fy-lbl" x={0} y={21} dominantBaseline="central">{t("cal.rowDasha")}</text>
      <text className="xs-fy-lbl" x={0} y={51} dominantBaseline="central">{t("cal.rowBazi")}</text>
      {row(10, dashas.map((d) => ({ key: d.lord, a: d.a, b: d.b, text: short(t(`cross.planet.${d.lord}` as TKey)) })))}
      {row(40, bazi.map((d) => ({ key: d.g, a: d.a, b: d.b, text: z(d.g) })))}
      {[0, 25, 50, 75, 100].map((k) => (
        <text key={k} className="cy-axis" x={x(y0 + k)} y={80} fontSize={9} textAnchor={k === 100 ? "end" : k === 0 ? "start" : "middle"}>{y0 + k}</text>
      ))}
      {now >= y0 && now <= y0 + SPAN ? (
        <g>
          <line className="cal-now" x1={x(now)} x2={x(now)} y1={4} y2={68} />
          <text className="cal-now-txt" x={x(now)} y={4} fontSize={9}>{t("cal.now")}</text>
        </g>
      ) : null}
    </svg>
  );
}

function Jyotish({ r, chart }: { r: JyotishResult; chart: ChartResult }) {
  const { t } = useLocale();
  const n = r.nakshatra;
  const a = `${Math.floor(r.ayanamsa)}°${String(Math.floor((r.ayanamsa % 1) * 60)).padStart(2, "0")}′`;
  return (
    <>
      <h3 className="xs-h">{t("cal.jyotish")}</h3>
      <p className="cy-val">{t("cal.nakVal", { n: n.n, name: n.iast, deva: n.devanagari, pct: `${(r.elapsed * 100).toFixed(1)}%`, lord: t(`cross.planet.${n.lord}` as TKey) })}</p>
      <p className="xs-note">{t("cal.ayanamsa", { a })}</p>
      <Meta tier={r.tier} cites={[r.cite, r.ayanamsaCite]} />
      <h3 className="xs-h">{t("cal.timeline")}</h3>
      <Timeline r={r} chart={chart} />
      <p className="xs-note">{t("cal.dashaNote")}</p>
      <Steps steps={r.steps} />
    </>
  );
}

/** 民用曆一年:12 個 30 日月 + 5 日,一格一月;出生日以短線標示。 */
function Egypt({ r }: { r: EgyptianResult }) {
  const { t } = useLocale();
  const doy = r.monthIndex * 30 + r.day;
  const cw = (W - 6) / 365;
  const label = t("cal.yearAria", { doy });
  return (
    <>
      <h3 className="xs-h">{t("cal.egypt")}</h3>
      <p className="cy-val">{t("cal.egyptVal", { y: r.year, m: r.month, d: r.day })}</p>
      <p className="xs-note">{t("cal.faceVal", { sign: r.face.sign, i: r.face.index + 1, ruler: t(`cross.planet.${r.face.ruler}` as TKey) })}</p>
      <Meta tier={r.tier} cites={[r.cite]} />
      <Meta tier={r.faceTier} cites={[r.faceCite]} />
      <svg className="xs-grid cal-year" viewBox={`0 0 ${W} 44`} role="img" aria-label={label}>
        <title>{label}</title>
        {Array.from({ length: 13 }, (_, i) => (
          <rect key={i} className={`cal-seg cal-seg-${i % 2}${i === 12 ? " cal-epa" : ""}`} x={3 + i * 30 * cw} y={12} width={(i === 12 ? 5 : 30) * cw - 1} height={18} />
        ))}
        <line className="cal-now" x1={3 + (doy - 0.5) * cw} x2={3 + (doy - 0.5) * cw} y1={6} y2={36} />
        <text className="cy-axis" x={3 + 15 * cw} y={40} fontSize={9}>Thoth</text>
        <text className="cy-axis" x={W - 10} y={40} fontSize={9}>+5</text>
      </svg>
      <Steps steps={r.steps} />
    </>
  );
}

/** 十九年格:出生年(金數位置)起 19 格,標閏月年份。 */
function Metonic({ r, year }: { r: MetonicResult; year: number }) {
  const { t } = useLocale();
  const cw = (W - 4) / 19;
  const label = t("cal.gridAria", { rows: r.leaps.map((x) => `${x.year}${x.leapMonth ? ` ${t("cal.leapShort", { m: x.leapMonth })}` : ""}`).join(", ") });
  return (
    <>
      <h3 className="xs-h">{t("cal.metonic")}</h3>
      <p className="cy-val">{t("cal.metonicVal", { g: r.golden, e: r.epact, y: year, em: r.easter.month, ed: r.easter.day })}</p>
      <p className="xs-note">{t("cal.leapVal", { n: r.leapCount, ly: r.lunarYear })}</p>
      <Meta tier={r.tier} cites={[r.cite, r.chineseCite]} />
      <svg className="xs-grid cal-grid" viewBox={`0 0 ${W} 46`} role="img" aria-label={label}>
        <title>{label}</title>
        {r.leaps.map((x, i) => (
          <g key={x.year}>
            <rect className={`xs-cell${x.leapMonth ? " hit" : ""}${i === 0 ? " cy-hit" : ""}`} x={2 + i * cw} y={4} width={cw - 2} height={24} rx={2} />
            {x.leapMonth ? <text className="cy-axis" x={2 + i * cw + cw / 2} y={16} fontSize={9}>{x.leapMonth}</text> : null}
            {i % 3 === 0 ? <text className="cy-axis" x={2 + i * cw + cw / 2} y={38} fontSize={8}>{String(x.year).slice(2)}</text> : null}
          </g>
        ))}
      </svg>
      <div className="viz-legend" aria-hidden="true">
        <span><i className="sw xs-sw-year" />{t("cal.legendBirth")}</span>
        <span><i className="sw cal-sw-leap" />{t("cal.legendLeap")}</span>
      </div>
      <Steps steps={r.steps} />
    </>
  );
}

export function CalendarCard({ chart }: { chart: ChartResult }) {
  const { t } = useLocale();
  const sky = useMemo(() => castEphemeris(chart.input), [chart]);
  const jy = useMemo(() => castJyotish(sky), [sky]);
  const eg = useMemo(() => castEgyptian(chart.input, sky), [chart, sky]);
  const me = useMemo(() => castMetonic(chart.input), [chart]);
  return (
    <div className="card viz xs">
      <p className="xs-sub">{t("cal.intro")}</p>
      <Jyotish r={jy} chart={chart} />
      <Egypt r={eg} />
      <Metonic r={me} year={chart.input.year} />
    </div>
  );
}
