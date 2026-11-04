"use client";

import { useMemo, useState } from "react";
import { SCIENCE_NOTES, type ScienceNote } from "@numerology/engine";
import { useLocale } from "@/lib/i18n";
import { atLeastOneProb, binomialDist, simulate } from "@/lib/baseRate";
import { CitePop } from "@/components/CrossSystemCard";
import { GroupTabs } from "@/components/GroupTabs";
import { STUDY_TABS } from "@/lib/navGroups";
import { yjT, type YijingLocale } from "@/lib/yijingStrings";

/*
 * 學院科學專區:科學筆記列表 + 基率模擬器 + 看別處效應說明。
 * 模擬用固定種子,同一 k、m 必得同一結果(原則 13);全部數字可展開步驟。
 */

const N = 10000;
const SEED = 1;
const pct = (p: number, d = 1) => `${(p * 100).toFixed(d)}%`;

function NoteMeta({ note }: { note: ScienceNote }) {
  const { t } = useLocale();
  return (
    <div className="xs-meta">
      <span className="xs-tier tier-science">{t("cross.tier.science")}</span>
      {note.reviewed ? null : <span className="xs-basis">{t("science.pending")}</span>}
      <CitePop cite={note.cite} />
    </div>
  );
}

/* 343 寬:左 34 放刻度,底 22 放 j;每組兩條(模擬 / 解析解)並排。 */
const W = 343, H = 200, PL = 34, PR = 4, PT = 8, PB = 22;
const PW = W - PL - PR, PH = H - PT - PB;

function BarChart({ k, m, sim, exact }: { k: number; m: number; sim: number[]; exact: number[] }) {
  const { t } = useLocale();
  const rows = sim.map((s, j) => t("science.chartRow", { j, sim: pct(s), exact: pct(exact[j]!) })).join(";");
  const label = t("science.chartAria", { k, m, rows });
  const gw = PW / (k + 1);
  const bw = Math.min(18, gw * 0.34);
  const y = (p: number) => PT + PH * (1 - p);
  return (
    <svg className="xs-grid sci-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      <title>{label}</title>
      {[0, 0.5, 1].map((g) => (
        <g key={g}>
          <line className="sci-gridline" x1={PL} x2={W - PR} y1={y(g)} y2={y(g)} />
          <text className="cy-axis" x={PL - 16} y={y(g)} fontSize={10}>{pct(g, 0)}</text>
        </g>
      ))}
      {sim.map((s, j) => {
        const cx = PL + gw * (j + 0.5);
        const e = exact[j]!;
        return (
          <g key={j}>
            <rect className="sci-bar-sim" x={cx - bw - 1} y={y(s)} width={bw} height={PH * s} />
            <rect className="sci-bar-exact" x={cx + 1} y={y(e)} width={bw} height={PH * e} />
            <text className="cy-axis" x={cx} y={H - PB / 2} fontSize={11}>{j}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Simulator() {
  const { t } = useLocale();
  const [k, setK] = useState(4);
  const [m, setM] = useState(5);
  const sim = useMemo(() => simulate(k, m, N, SEED), [k, m]);
  const exact = useMemo(() => binomialDist(k, m), [k, m]);
  const atLeast = atLeastOneProb(k, m);
  return (
    <div className="card viz xs">
      <h2 className="xs-h">{t("science.sim")}</h2>
      <p className="xs-sub">{t("science.simIntro", { n: N.toLocaleString("en-US") })}</p>
      <label className="sci-range">
        <span>{t("science.k", { k })}</span>
        <input type="range" min={2} max={6} step={1} value={k} onChange={(e) => setK(Number(e.target.value))} />
      </label>
      <label className="sci-range">
        <span>{t("science.m", { m })}</span>
        <input type="range" min={2} max={12} step={1} value={m} onChange={(e) => setM(Number(e.target.value))} />
      </label>
      <p className="cy-val">{t("science.atLeastOne", { sim: pct(1 - sim[0]!, 2), exact: pct(atLeast, 2) })}</p>
      <div className="viz-legend" aria-hidden="true">
        <span><i className="sw sci-sw-sim" />{t("science.legendSim")}</span>
        <span><i className="sw sci-sw-exact" />{t("science.legendExact")}</span>
      </div>
      <BarChart k={k} m={m} sim={sim} exact={exact} />
      <p className="xs-note" style={{ textAlign: "center" }}>{t("science.axisJ")}</p>
      <details className="xs-steps">
        <summary>{t("cross.steps")}</summary>
        <ol>
          <li>{t("science.step1", { m })}</li>
          <li>{t("science.step2", { k })}</li>
          <li>{t("science.step3", { k, m, exact: atLeast.toFixed(4) })}</li>
          <li>{t("science.step4", { seed: SEED, n: N })}</li>
          {sim.map((s, j) => (
            <li key={j}>{t("science.chartRow", { j, sim: pct(s, 2), exact: pct(exact[j]!, 2) })}</li>
          ))}
        </ol>
      </details>
    </div>
  );
}

export default function ScienceTool() {
  const { locale, t } = useLocale();
  const look = SCIENCE_NOTES.find((n) => n.id === "look-elsewhere");
  return (
    <>
      <GroupTabs links={STUDY_TABS} label={yjT("nav.group.study", locale as YijingLocale)} />
      <h1 className="large">{t("science.title")}</h1>
      <p className="muted" style={{ margin: "0 0 16px" }}>{t("science.intro")}</p>

      <div className="card viz xs">
        <h2 className="xs-h">{t("science.notes")}</h2>
        <ul className="xs-matrix">
          {SCIENCE_NOTES.map((n) => (
            <li key={n.id} className="xs-row">
              <p className="sci-claim">{n.claim[locale]}</p>
              <NoteMeta note={n} />
            </li>
          ))}
        </ul>
      </div>

      <Simulator />

      <div className="card viz xs">
        <h2 className="xs-h">{t("science.lookTitle")}</h2>
        <p className="xs-sub">{t("science.lookBody")}</p>
        {look ? (
          <blockquote className="sci-quote">
            <p className="sci-claim">{look.claim[locale]}</p>
            <NoteMeta note={look} />
          </blockquote>
        ) : null}
      </div>
    </>
  );
}
