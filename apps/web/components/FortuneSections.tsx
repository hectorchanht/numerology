"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { DaYunAnalysis, FortuneAnalysis, ZiweiScopeFortune } from "@numerology/engine";
import { useLocale, type TKey } from "@/lib/i18n";
import { markdownTermComponents, withTermHighlights } from "@/lib/highlightTerms";
import {
  splitDayunSteps,
  splitYearBlocks,
  parseVerdictAnalysis,
  parseRhythmItems,
} from "@/lib/fortuneBlocks";

export type Lens = "bazi" | "ziwei" | "both";

/* ── 依据收納:次要樣式的可摺疊證據區 ─────────────────────────── */

function Evidence({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();
  return (
    <details className="evid">
      <summary>{t("fortune.evidence")}</summary>
      <div className="evid-body">{children}</div>
    </details>
  );
}

/* ── 術語 pills(點按出釋義,沿用術語底線系統) ─────────────────── */

function BaziPills({ d }: { d: DaYunAnalysis }) {
  const { t } = useLocale();
  return (
    <div className="pill-grp">
      <span className="grp-lbl">{t("fortune.grpBazi")}</span>
      <span className="tag">{withTermHighlights(`${t("fortune.lblTiangan")}·${d.ganShiShen}`)}</span>
      {d.hideShiShen.map((h, i) => (
        <span className="tag" key={i}>
          {withTermHighlights(`${t("fortune.lblHidden")}·${h.gan}${h.shiShen}`)}
        </span>
      ))}
      {d.suppliesUseGod ? <span className="tag accent">{t("fortune.useGodHit")}</span> : null}
    </div>
  );
}

function ZiweiPills({ scope }: { scope: ZiweiScopeFortune }) {
  const { t } = useLocale();
  return (
    <div className="pill-grp">
      <span className="grp-lbl">{t("fortune.grpZiwei")}</span>
      <span className="tag">
        {withTermHighlights(
          `${t("fortune.lblDecadal")}·${scope.heavenlyStem}${scope.earthlyBranch}·行${scope.palaceName}`,
        )}
      </span>
      {scope.sihua.map((s, i) => (
        <span className="tag" key={i}>
          {withTermHighlights(`化${s.type}·${s.star}→${s.intoPalace}`)}
        </span>
      ))}
    </div>
  );
}

function YearPills({
  ganShiShen,
  suppliesUseGod,
  yearly,
  lens,
}: {
  ganShiShen: string;
  suppliesUseGod: boolean;
  yearly?: ZiweiScopeFortune;
  lens: Lens;
}) {
  const { t } = useLocale();
  return (
    <div className="pill-grp">
      {lens !== "ziwei" ? (
        <>
          <span className="tag">{withTermHighlights(`${t("fortune.lblYear")}·${ganShiShen}`)}</span>
          {suppliesUseGod ? <span className="tag accent">{t("fortune.useGodHit")}</span> : null}
        </>
      ) : null}
      {lens !== "bazi"
        ? yearly?.sihua.map((s, i) => (
            <span className="tag" key={i}>
              {withTermHighlights(`化${s.type}·${s.star}→${s.intoPalace}`)}
            </span>
          ))
        : null}
    </div>
  );
}

/* ── 大運↔大限雙軌圖:每步大運指向其同期大限 ──────────────────── */

function DualLane({ fortune, lens }: { fortune: FortuneAnalysis; lens: Lens }) {
  const { t } = useLocale();
  const showBazi = lens !== "ziwei";
  const showZiwei = lens !== "bazi";
  return (
    <>
      {showBazi && showZiwei ? <p className="note lane-legend">{t("fortune.laneLegend")}</p> : null}
      <div className="strip dual-lane">
        {fortune.bazi.daYun.map((d) => (
          <div className={`dl-col${d.isCurrent ? " now" : ""}`} key={d.ganZhi}>
            {showBazi ? (
              <div className="dl-cell bazi">
                <span className="dl-gz">{d.ganZhi}</span>
                <span className="dl-meta">{t("fortune.ageRange", { a: d.startAge, b: d.endAge })}</span>
              </div>
            ) : null}
            {showBazi && showZiwei ? <div className="dl-link" aria-hidden="true" /> : null}
            {showZiwei ? (
              <div className="dl-cell ziwei">
                <span className="dl-gz">
                  {d.ziweiDecadal.heavenlyStem}
                  {d.ziweiDecadal.earthlyBranch}
                </span>
                <span className="dl-meta">行{d.ziweiDecadal.palaceName}</span>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </>
  );
}

/* ── 二、大運逐步精講 ───────────────────────────────────────── */

export function FortuneDayun({
  md,
  fortune,
  lens,
}: {
  md: string;
  fortune: FortuneAnalysis;
  lens: Lens;
}) {
  const chunks = splitDayunSteps(
    md,
    fortune.bazi.daYun.map((d) => d.ganZhi),
  );
  // 切唔出塊(舊文本/模型走樣) → 交回預設 markdown 渲染,唔好吞內容。
  if (chunks.length === 0) return null;
  const byGanzhi = new Map(fortune.bazi.daYun.map((d) => [d.ganZhi, d]));
  return (
    <>
      <DualLane fortune={fortune} lens={lens} />
      {chunks.map((c) => {
        const d = byGanzhi.get(c.key);
        if (!d) return null;
        const { verdict, analysis } = parseVerdictAnalysis(c.body);
        return (
          <section className="dy-card" key={c.key}>
            <h4 className="dy-head">{c.heading.replace(/^#+\s*/, "")}</h4>
            {verdict ? (
              <div className="verdict">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownTermComponents}>
                  {verdict}
                </ReactMarkdown>
              </div>
            ) : null}
            {analysis ? (
              <div className="prose sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownTermComponents}>
                  {analysis}
                </ReactMarkdown>
              </div>
            ) : null}
            <Evidence>
              {lens !== "ziwei" ? <BaziPills d={d} /> : null}
              {lens !== "bazi" ? <ZiweiPills scope={d.ziweiDecadal} /> : null}
            </Evidence>
          </section>
        );
      })}
    </>
  );
}

/* ── 三/四、流年:year row 卡 ─────────────────────────────────── */

export function FortuneYears({
  md,
  fortune,
  lens,
  past,
}: {
  md: string;
  fortune: FortuneAnalysis;
  lens: Lens;
  past: boolean;
}) {
  const { t } = useLocale();
  const list = fortune.bazi.liuNian.filter((y) => (past ? y.isPast : !y.isPast));
  const chunks = splitYearBlocks(
    md,
    list.map((y) => y.year),
  );
  if (chunks.length === 0) return null;
  const byYear = new Map(list.map((y) => [String(y.year), y]));
  const ziweiByYear = new Map((fortune.ziwei.yearly ?? []).map((z) => [String(z.year), z]));
  return (
    <>
      {chunks.map((c) => {
        const y = byYear.get(c.key);
        if (!y) return null;
        const z = ziweiByYear.get(c.key);
        const { verdict, analysis } = parseVerdictAnalysis(c.body);
        return (
          <section className="yr-row" key={c.key}>
            <div className="yr-badge">
              <span className="yr">{y.year}</span>
              <span className="yr-meta">
                {y.ganZhi} · {t("fortune.age", { n: y.age })}
              </span>
            </div>
            {verdict ? (
              <div className="verdict">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownTermComponents}>
                  {verdict}
                </ReactMarkdown>
              </div>
            ) : null}
            {analysis ? (
              <div className="prose sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownTermComponents}>
                  {analysis}
                </ReactMarkdown>
              </div>
            ) : null}
            {lens !== "ziwei" || z ? (
              <Evidence>
                <YearPills
                  ganShiShen={y.ganShiShen}
                  suppliesUseGod={y.suppliesUseGod}
                  yearly={z}
                  lens={lens}
                />
              </Evidence>
            ) : null}
          </section>
        );
      })}
    </>
  );
}

/* ── 五、節奏與轉折:年份 badge 時間線 ────────────────────────── */

export function FortuneRhythm({ md }: { md: string }) {
  const items = parseRhythmItems(md);
  if (items.length === 0) return null;
  return (
    <ol className="rhythm-tl">
      {items.map((it, i) => (
        <li key={i}>
          {it.year !== null ? (
            <span className="yr-badge sm">{it.year}</span>
          ) : (
            <span className="yr-dot" aria-hidden="true" />
          )}
          <span className="rhythm-text">{withTermHighlights(it.text)}</span>
        </li>
      ))}
    </ol>
  );
}

/** i18n key 引用檢查用(避免 TKey 拼錯):本文件用到的 fortune.* key。 */
export const FORTUNE_SECTION_KEYS = [
  "fortune.evidence",
  "fortune.grpBazi",
  "fortune.grpZiwei",
  "fortune.lblTiangan",
  "fortune.lblHidden",
  "fortune.lblDecadal",
  "fortune.lblYear",
  "fortune.useGodHit",
  "fortune.laneLegend",
] satisfies TKey[];
