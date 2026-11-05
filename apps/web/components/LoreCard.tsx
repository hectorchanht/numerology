"use client";

import { useMemo } from "react";
import {
  castBirthLore, castEphemeris, castNumberLore,
  type BirthLoreResult, type ChartResult, type NumberClass, type NumberLoreResult,
} from "@numerology/engine";
import type { Cite } from "@numerology/knowledge";
import { useLocale, useScript, type TKey } from "@/lib/i18n";
import { arcPath, wheelPoint } from "@/lib/loreView";
import { CitePop } from "@/components/CrossSystemCard";

/*
 * 數之學卡:你的數(Nicomachus 分類、Agrippa 數階、希伯來字母、gematria + 基率)與出生對應(律呂、黃道、星期、Behenian 恆星)。
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

function classText(c: NumberClass, t: (k: TKey, v?: Record<string, string | number>) => string): string {
  return [
    t(`lore.parity.${c.parity}` as TKey),
    c.parts ? t(`lore.parts.${c.parts}` as TKey) : null,
    ...c.figurate.map((f) => t(`lore.fig.${f.sides}` as TKey, { i: f.index })),
    c.cube ? t("lore.cube", { c: c.cube }) : null,
  ].filter(Boolean).join("、");
}

/* 期望 vs 實際兩條橫棒;刻度上限取兩者較大值與 1。 */
function BaseBars({ expected, actual }: { expected: number; actual: number }) {
  const { t } = useLocale();
  const max = Math.max(1, expected, actual);
  const W = 343, L = 56, bw = W - L - 30;
  const e = expected.toFixed(2);
  const label = t("lore.baseAria", { e, h: actual });
  return (
    <svg className="xs-fy" viewBox={`0 0 ${W} 52`} role="img" aria-label={label}>
      <title>{label}</title>
      {([["lore.expected", expected, "xs-fy-band"], ["lore.actual", actual, "xs-fy-bar"]] as const).map(([k, v, cls], i) => (
        <g key={k}>
          <text className="xs-fy-lbl" x={0} y={14 + i * 24} dominantBaseline="central">{t(k)}</text>
          <rect className="xs-fy-track" x={L} y={6 + i * 24} width={bw} height={16} rx={3} />
          <rect className={cls} x={L} y={6 + i * 24} width={(bw * v) / max} height={16} rx={3} />
          <text className="xs-fy-lbl" x={L + bw + 4} y={14 + i * 24} dominantBaseline="central">{i ? v : e}</text>
        </g>
      ))}
    </svg>
  );
}

function Numbers({ r }: { r: NumberLoreResult }) {
  const { t } = useLocale();
  const b = r.baseRate;
  return (
    <>
      <h3 className="xs-h">{t("lore.numbers")}</h3>
      <Meta tier={r.tiers.classes} cites={[r.cites.nicomachus, r.cites.scales, r.cites.hebrew]} />
      <ul className="xs-matrix">
        {r.items.map((it) => (
          <li key={it.source} className="xs-row">
            <div className="xs-head">
              <span className="xs-sys">{t(`lore.src.${it.source}` as TKey)}</span>
              <span className="xs-val">{it.value}</span>
              <span className="xs-note">{classText(it.cls, t)}</span>
            </div>
            {it.hebrew ? (
              <p className="xs-note">{t("lore.colLetter")}:<span lang="he">{it.hebrew.glyph}</span> {it.hebrew.name}({t(`lore.group.${it.hebrew.group}` as TKey)})</p>
            ) : null}
            {it.gematria.length ? (
              <p className="xs-note">{t("lore.colGreek")}:{it.gematria.map((g) => `${g.greek}(${g.gloss})`).join("、")}</p>
            ) : null}
            {it.scale ? (
              <details className="xs-steps">
                <summary>{t("lore.scale", { n: it.scale.n, ch: it.scale.chapter })}</summary>
                <ul lang="en">{it.scale.rows.map((row, i) => <li key={i}><b>{row.world}</b> · {row.label}: {row.items.join(", ")}</li>)}</ul>
              </details>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="xs-note">{t("lore.scaleNote")}</p>
      <h3 className="xs-h">{t("lore.baseTitle")}</h3>
      <Meta tier={r.tiers.gematria} cites={[r.cites.gematria]} />
      <p className="xs-note">{t("lore.baseVal", { e: b.expected.toFixed(2), h: b.hits, d: b.distinct, m: b.max })}</p>
      <BaseBars expected={b.expected} actual={b.hits} />
      <Steps steps={r.steps} />
    </>
  );
}

const C = 120, R = 100;
const GLYPH: Record<string, string> = { Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂", Jupiter: "♃", Saturn: "♄" };

/** 黃道圓:十五恆星 ±orb 陰影弧、星點,與出生七曜 / 上升 / 天頂。 */
function StarWheel({ r, sky }: { r: BirthLoreResult; sky: ReturnType<typeof castEphemeris> }) {
  const { t } = useLocale();
  const s = r.stars;
  const hitText = s.hits.map((h) => `${h.body}–${h.star}`).join(", ") || t("lore.none");
  const label = t("lore.wheelAria", { orb: s.orb, k: s.points, hits: hitText });
  const points: [string, number][] = sky.planets.map((p) => [GLYPH[p.planet], p.longitude]);
  if (sky.angles) points.push(["Asc", sky.angles.ascendant], ["MC", sky.angles.mc]);
  points.sort((a, b) => a[1] - b[1]);
  let level = 0;
  const levels = points.map(([, lon], i) => {
    const gap = i ? lon - points[i - 1]![1] : 360;
    level = gap < 12 ? (level + 1) % 3 : 0;
    return level;
  });
  return (
    <svg className="xs-grid lore-wheel" viewBox={`0 0 ${C * 2} ${C * 2}`} role="img" aria-label={label}>
      <title>{label}</title>
      <circle className="xs-cell" cx={C} cy={C} r={R} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = wheelPoint(i * 30, R, C), b = wheelPoint(i * 30, R - 8, C);
        return <line key={i} className="sci-gridline" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
      })}
      {s.lons.filter((x) => !x.alt).map((x) => (
        <path key={x.n} className="lore-zone" d={arcPath(x.lon - s.orb, x.lon + s.orb, R, C)} />
      ))}
      {s.lons.map((x) => {
        const p = wheelPoint(x.lon, R, C);
        return <circle key={`${x.n}${x.alt}`} className={x.alt ? "lore-star alt" : "lore-star"} cx={p.x} cy={p.y} r={3} />;
      })}
      {points.map(([name, lon], i) => {
        const p = wheelPoint(lon, R - 24 - levels[i]! * 16, C), q = wheelPoint(lon, R - 4, C);
        return (
          <g key={name}>
            <line className="lore-ray" x1={p.x} y1={p.y} x2={q.x} y2={q.y} />
            <text className="cy-axis" x={p.x} y={p.y} fontSize={name.length > 1 ? 9 : 12}>{name}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Birth({ r, sky }: { r: BirthLoreResult; sky: ReturnType<typeof castEphemeris> }) {
  const { t } = useLocale();
  const { z } = useScript();
  const l = r.lulu;
  const pct = `${Math.round(r.stars.p * 1000) / 10}%`;
  return (
    <>
      <h3 className="xs-h">{t("lore.lulu")}</h3>
      <p className="cy-val">
        {z(t("lore.luluVal", {
          m: l.lunarMonth, b: l.branch, pipe: l.pipe, v: l.value, season: l.season,
          group: t(l.group === "upper" ? "lore.upper" : "lore.lower"), mode: l.mode ? t("lore.mode", { mode: l.mode }) : "",
        }))}
      </p>
      <Meta tier="classical" cites={[r.cites.lulu]} />

      <h3 className="xs-h">{t("lore.zodiac")}</h3>
      <p className="cy-val">{t("lore.zodiacVal", { sign: r.zodiac.sign, ruler: r.zodiac.ruler, herb: r.zodiac.herb, fume: r.zodiac.fume })}</p>
      {r.zodiac.letter ? <p className="xs-note">{t("lore.syLetter", { g: r.zodiac.letter.glyph, f: r.zodiac.letter.faculty, m: r.zodiac.letter.month })}</p> : null}
      {r.dayPlanet.letter ? <p className="xs-note">{t("lore.dayLetter", { planet: r.dayPlanet.planet, g: r.dayPlanet.letter.glyph, q: r.dayPlanet.letter.quality })}</p> : null}
      <Meta tier="classical" cites={[r.cites.zodiac]} />
      <Meta tier="modern" cites={[r.cites.seferYetzirah]} />
      <p className="xs-note">{t("lore.syNote")}</p>

      <h3 className="xs-h">{t("lore.stars")}</h3>
      <p className="cy-val">{t("lore.starsVal", { orb: r.stars.orb, n: r.stars.hits.length, p: pct, k: r.stars.points, e: r.stars.expected.toFixed(1) })}</p>
      <Meta tier="modern" cites={[r.cites.stars, r.cites.orb]} />
      <StarWheel r={r} sky={sky} />
      {r.stars.hits.length ? (
        <ul className="xs-note">
          {r.stars.hits.map((h, i) => (
            <li key={i}>{t("lore.hit", { body: h.body, star: h.star, bayer: h.bayer, d: h.orb })}</li>
          ))}
        </ul>
      ) : null}
      {r.stars.altHits.length ? (
        <p className="xs-note">{t("lore.altHits", { list: r.stars.altHits.map((h) => `${h.body}–${h.star} ${h.orb}°`).join(", ") })}</p>
      ) : null}
      <p className="xs-note">{t("lore.starsNote")}</p>
      <Steps steps={r.steps} />
    </>
  );
}

export function LoreCard({ chart }: { chart: ChartResult }) {
  const { t } = useLocale();
  const nums = useMemo(() => castNumberLore(chart), [chart]);
  const sky = useMemo(() => castEphemeris(chart.input), [chart]);
  const birth = useMemo(() => castBirthLore(chart, sky), [chart, sky]);
  return (
    <div className="card viz xs">
      <p className="xs-sub">{t("lore.intro")}</p>
      <Numbers r={nums} />
      <h3 className="xs-h">{t("lore.birth")}</h3>
      <Birth r={birth} sky={sky} />
    </div>
  );
}
