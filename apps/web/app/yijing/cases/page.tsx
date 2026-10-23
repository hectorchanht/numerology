"use client";

import { useState } from "react";
import {
  getHexagram,
  ZHANLI_CASES,
  type ZhanliCase,
  type ZhanliQuoteRef,
} from "@numerology/knowledge";
import { useLocale, useScript } from "@/lib/i18n";
import { yjT, type YijingLocale } from "@/lib/yijingStrings";
import { withQuoteRefs, type QuoteRefEntry } from "@/lib/quoteRef";
import { withTermHighlights } from "@/lib/highlightTerms";

/** 經典卦形:陽爻一橫,陰爻兩截(由下而上)。 */
function HexFigure({ bits }: { bits: number[] }) {
  const yang: React.CSSProperties = {
    display: "block",
    width: 44,
    height: 5,
    borderRadius: 3,
    background: "currentColor",
  };
  const yin: React.CSSProperties = { ...yang, width: 20 };
  return (
    <span aria-hidden style={{ display: "inline-flex", flexDirection: "column", gap: 4 }}>
      {[...bits].reverse().map((b, i) => (
        <span key={i} style={{ display: "flex", gap: 4 }}>
          {b === 1 ? (
            <span style={yang} />
          ) : (
            <>
              <span style={yin} />
              <span style={yin} />
            </>
          )}
        </span>
      ))}
    </span>
  );
}

const VERDICT_KEY: Record<ZhanliCase["outcome"]["verdict"], string> = {
  "應驗": "cases.verdict.fulfilled",
  "部分應驗": "cases.verdict.partial",
  "存疑": "cases.verdict.unrecorded",
};

/** 應驗徽章:應驗用 accent tag,其餘用普通 tag。 */
function VerdictBadge({
  verdict,
  loc,
}: {
  verdict: ZhanliCase["outcome"]["verdict"];
  loc: YijingLocale;
}) {
  return (
    <span className={`tag${verdict === "應驗" ? " accent" : ""}`}>
      {yjT(VERDICT_KEY[verdict], loc)}
    </span>
  );
}

function toQuoteRefEntry(q: ZhanliQuoteRef): QuoteRefEntry {
  return {
    id: q.id,
    quote: q.quote,
    fullText: q.fullText,
    sourceLabel: q.sourceLabel,
    url: q.url,
  };
}

function CaseDetail({ c, loc, onBack }: { c: ZhanliCase; loc: YijingLocale; onBack: () => void }) {
  // 案例係繁體正本(古籍原文 + 白話)→ zT(只喺 zhs 轉)
  const { zT } = useScript();
  const d = c.divination;
  const ben = getHexagram(d.hexagramNum);
  const bian = d.changedToNum ? getHexagram(d.changedToNum) : null;
  const refs = c.quoteRefs.map(toQuoteRefEntry);
  if (!ben) return null;

  return (
    <div style={{ maxWidth: 680 }}>
      <button
        onClick={onBack}
        style={{
          font: "inherit",
          fontSize: 14,
          color: "var(--accent)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          marginBottom: 12,
        }}
      >
        ← {yjT("cases.title", loc)}
      </button>

      <div className="masthead" style={{ paddingTop: 0 }}>
        <h1>{zT(c.title)}</h1>
        <div className="sub">
          {yjT("cases.source", loc)}:{zT(c.sourceLabel)}
          {" · "}
          <a
            href={c.sourceUrl}
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--accent)" }}
          >
            查原文 ↗
          </a>
        </div>
      </div>

      {/* 占斷資訊 */}
      <div className="card">
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "6px 20px",
            fontSize: 14,
          }}
        >
          <span className="muted">
            {yjT("cases.method", loc)}:
            <span style={{ color: "var(--ink)" }}> {zT(d.method)}</span>
          </span>
          <span className="muted">
            {yjT("cases.moving", loc)}:
            <span style={{ color: "var(--ink)" }}> {zT(d.movingLines)}</span>
          </span>
          <span style={{ marginLeft: "auto" }}>
            <VerdictBadge verdict={c.outcome.verdict} loc={loc} />
          </span>
        </div>
        <div
          style={{
            marginTop: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 28,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <HexFigure bits={ben.bits} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              {zT(d.hexagram)} <span className="muted">· {yjT("cases.ben", loc)}</span>
            </span>
          </div>
          {bian && (
            <>
              <span style={{ fontSize: 20, color: "var(--label-3)" }}>之</span>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <HexFigure bits={bian.bits} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  {zT(d.changedTo)} <span className="muted">· {yjT("cases.bian", loc)}</span>
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 原文 */}
      <h3 className="section-title" style={{ marginTop: "1.6rem" }}>
        {yjT("cases.original", loc)}
      </h3>
      <div className="card">
        {c.originalText.split("\n\n").map((para, i) => (
          <p
            key={i}
            style={{
              margin: i === 0 ? 0 : "1em 0 0",
              fontFamily: "var(--serif)",
              fontSize: 17,
              lineHeight: 2,
            }}
          >
            {zT(para)}
          </p>
        ))}
      </div>

      {/* 本站白話解說 */}
      <h3 className="section-title" style={{ marginTop: "1.6rem" }}>
        {yjT("cases.baihua", loc)}
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {c.baihua.map((p, i) => (
          <p key={i} style={{ margin: 0, fontSize: 15, lineHeight: 1.9 }}>
            {withTermHighlights(withQuoteRefs(p, refs), zT)}
          </p>
        ))}
      </div>

      {/* 歷史應驗 */}
      <h3 className="section-title" style={{ marginTop: "1.6rem" }}>
        {yjT("cases.history", loc)} <VerdictBadge verdict={c.outcome.verdict} loc={loc} />
      </h3>
      <div className="card" style={{ borderColor: "var(--accent-line)" }}>
        <p style={{ margin: 0, fontFamily: "var(--serif)", fontSize: 16, lineHeight: 1.9 }}>
          {zT(c.outcome.text)}
        </p>
        <p className="muted" style={{ margin: "12px 0 0", lineHeight: 1.8 }}>
          {zT(c.outcome.reason)}
        </p>
      </div>
    </div>
  );
}

export default function CasesPage() {
  const { locale } = useLocale();
  const { zT } = useScript();
  const loc = locale as YijingLocale;
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = activeId ? ZHANLI_CASES.find((c) => c.id === activeId) ?? null : null;

  // padding 由 app/yijing/layout.tsx 嘅 PageShell 統一提供,呢度唔再包。
  if (active) return <CaseDetail c={active} loc={loc} onBack={() => setActiveId(null)} />;

  return (
    <>
      <div className="masthead">
        <h1>{yjT("cases.title", loc)}</h1>
        <div className="sub">{yjT("cases.sub", loc)}</div>
      </div>

      <div className="card">
        <p className="muted" style={{ margin: 0, lineHeight: 1.8 }}>
          {yjT("cases.intro", loc)}
        </p>
      </div>

      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
        {ZHANLI_CASES.map((c, idx) => {
          const ben = getHexagram(c.divination.hexagramNum);
          if (!ben) return null;
          return (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className="card case-row"
              aria-label={zT(c.title)}
            >
              <span className="case-hex">
                <HexFigure bits={ben.bits} />
              </span>
              <span className="case-main">
                <span className="case-title">
                  <span className="muted" style={{ marginRight: 8 }}>{idx + 1}</span>
                  {zT(c.title)}
                </span>
                <span className="case-meta">
                  {zT(c.sourceLabel)} · {zT(c.divination.hexagram)}
                  {c.divination.changedTo ? `之${zT(c.divination.changedTo)}` : ""}
                </span>
              </span>
              <span className="case-side">
                <VerdictBadge verdict={c.outcome.verdict} loc={loc} />
                <span className="case-chev">›</span>
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
