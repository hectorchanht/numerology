"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { castMeihua, type MeihuaResult } from "@numerology/engine";
import { getHexagram, TRIGRAM_INFO, yaoName } from "@numerology/knowledge";
import { useLocale, useScript } from "@/lib/i18n";
import { yjT, type YijingLocale } from "@/lib/yijingStrings";
import { AiInterpret } from "../AiInterpret";
import { Term, withTermHighlights } from "@/lib/highlightTerms";
import { QuoteRef, type QuoteRefEntry } from "@/lib/quoteRef";
import { saveYijingCast, getYijingCast } from "@/lib/yijingHistory";

/** 方法出處(公有領域原文,已對維基文庫核實逐字)。 */
const METHOD_QUOTE: QuoteRefEntry = {
  id: "meihua-time-method",
  quote: "年月日之數為上卦，年月日加時之數為下卦",
  fullText:
    "先天之數，謂物之所生氣之，所置事之所遇，皆有年、月、日、時，年以子年起一數，年有十二月，則以正月起一數，月有三十日，則以初一起一數，日有十二時，則以子時起一數，皆隨其數而數之，以分八卦，如一為乾，二為兌而八則為坤也，除八之外，則用畸零之數起焉，年月日之數為上卦，年月日加時之數為下卦，合年月日時之數，以六除之，餘為動爻。",
  sourceLabel: "《梅花易數·象數易理篇》",
  url: "https://zh.wikisource.org/wiki/梅花易數",
};

const TIYONG_QUOTE: QuoteRefEntry = {
  id: "meihua-tiyong",
  quote: "無動爻者為體，有動爻者為用",
  fullText:
    "凡上下二卦無動爻者為體，有動爻者為用，體卦為主，用卦為事，互卦為事之中應，變卦為事之末應。",
  sourceLabel: "《梅花易數·體用生克篇》",
  url: "https://zh.wikisource.org/wiki/梅花易數",
};

/** 經典卦形:陽爻一橫,陰爻兩截(由下而上 render 時傳 reversed)。 */
function HexFigure({ bits, moving }: { bits: number[]; moving?: boolean[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "7px", width: "84px" }}>
      {[...bits].reverse().map((b, i) => (
        <div key={i} style={{ display: "flex", gap: "6px", height: "9px" }}>
          {b === 1 ? (
            <div
              style={{
                flex: 1,
                background: "var(--ink)",
                borderRadius: "2px",
                outline: moving?.[5 - i] ? "2px solid var(--cinnabar)" : "none",
                outlineOffset: "2px",
              }}
            />
          ) : (
            <>
              <div style={{ flex: 1, background: "var(--ink)", borderRadius: "2px" }} />
              <div style={{ flex: 1, background: "var(--ink)", borderRadius: "2px" }} />
            </>
          )}
        </div>
      ))}
    </div>
  );
}

const VERDICT_TONE: Record<string, string> = {
  大吉: "var(--cinnabar)",
  中吉: "var(--ink)",
  小吉: "var(--ink-soft)",
  小凶: "var(--cinnabar)",
  大凶: "var(--cinnabar)",
};

function toLocalInputValue(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function MeihuaTool({ historyId }: { historyId?: string }) {
  const { locale } = useLocale();
  // 梅花引擎 / 卦爻辭係繁體正本 → zT(只喺 zhs 轉)
  const { zT } = useScript();
  const loc = locale as YijingLocale;
  const [dt, setDt] = useState(() => toLocalInputValue(new Date()));
  const [castKey, setCastKey] = useState(0);
  /** 歷史回顧模式:由 ?h=<id> 入嚟,唔再存檔 */
  const reviewMode = useRef(false);
  const [reviewAt, setReviewAt] = useState<number | null>(null);

  const result: MeihuaResult | null = useMemo(() => {
    if (castKey === 0) return null;
    const m = dt.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
    if (!m) return null;
    try {
      return castMeihua(+m[1]!, +m[2]!, +m[3]!, +m[4]!);
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [castKey]);

  // 歷史回顧:還原起卦時間
  useEffect(() => {
    if (!historyId) return;
    let alive = true;
    getYijingCast(historyId)
      .then((rec) => {
        if (!alive || !rec || rec.kind !== "meihua" || !rec.datetime) return;
        reviewMode.current = true;
        setReviewAt(rec.at);
        setDt(rec.datetime);
        setCastKey(1);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [historyId]);

  const doCast = () => {
    setCastKey((k) => k + 1);
    if (reviewMode.current) return;
    saveYijingCast({ kind: "meihua", at: Date.now(), datetime: dt }).catch(() => {});
  };

  const ben = result ? getHexagram(result.hexagram) : undefined;
  const bian = result ? getHexagram(result.changed) : undefined;
  const hu = result ? getHexagram(result.hu) : undefined;

  const trigramCard = (name: "upper" | "lower", tri: keyof typeof TRIGRAM_INFO) => {
    const info = TRIGRAM_INFO[tri];
    const isYong = result!.yong === tri;
    const isTi = result!.ti === tri;
    return (
      <div className="card" style={{ marginTop: 0, flex: "1 1 160px" }}>
        <div className="muted" style={{ fontSize: "0.85rem", marginBottom: "0.3rem" }}>
          {yjT(name === "upper" ? "meihua.upper" : "meihua.lower", loc)}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.6rem" }}>
          <span style={{ fontSize: "2.2rem", lineHeight: 1 }}>{info.symbol}</span>
          <span style={{ fontFamily: "var(--serif)", fontSize: "1.3rem" }}>{tri}</span>
          <span className="muted">{info.nature} · {info.element}行</span>
        </div>
        <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.4rem" }}>
          {isYong && <span className="badge badge-warn">{yjT("meihua.yong", loc)}</span>}
          {isTi && <span className="badge">{yjT("meihua.ti", loc)}</span>}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="masthead">
        <h1>{yjT("meihua.title", loc)}</h1>
        <div className="sub">{yjT("meihua.sub", loc)}</div>
      </div>

      {reviewAt !== null && (
        <div className="card" style={{ borderColor: "var(--cinnabar-soft)", marginBottom: "1rem" }}>
          <span className="badge">{yjT("yijing.hist.reviewing", loc)}</span>{" "}
          <span className="muted">{new Date(reviewAt).toLocaleString()}</span>{" "}
          <Link href="/yijing/history" style={{ marginLeft: "0.5rem" }}>
            {yjT("yijing.hist.backToHistory", loc)}
          </Link>
        </div>
      )}

      <div className="card">
        <div className="field">
          <label htmlFor="mh-dt">{yjT("meihua.datetime", loc)}</label>
          <input
            id="mh-dt"
            type="datetime-local"
            value={dt}
            onChange={(e) => setDt(e.target.value)}
          />
        </div>
        <div className="strip" style={{ marginTop: "1rem" }}>
          <button className="btn" onClick={doCast}>
            {yjT("meihua.cast", loc)}
          </button>
        </div>
        <p className="muted" style={{ marginTop: "0.7rem", marginBottom: 0 }}>
          {yjT("meihua.method", loc)}: {withTermHighlights(yjT("meihua.methodText", loc))}{" "}
          <QuoteRef entry={METHOD_QUOTE} />
        </p>
      </div>

      {result && ben && (
        <div className="card yj-result">
          <h2 className="section-title">{yjT("yijing.result", loc)}</h2>

          {/* 四數 */}
          <div className="muted" style={{ marginBottom: "0.8rem" }}>
            {yjT("meihua.numbers", loc)}: {yjT("meihua.yearNum", loc)}
            {result.numbers.yearNum}({result.numbers.yearZhi}) · {yjT("meihua.monthNum", loc)}
            {result.numbers.monthNum} · {yjT("meihua.dayNum", loc)}
            {result.numbers.dayNum} · {yjT("meihua.hourNum", loc)}
            {result.numbers.hourNum}({result.numbers.hourZhi}) · {result.numbers.lunarLabel}
          </div>

          {/* 上下卦 + 體用 */}
          <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            {trigramCard("upper", result.upper)}
            {trigramCard("lower", result.lower)}
          </div>

          {/* 體用斷 */}
          <div
            className="card"
            style={{ marginTop: 0, borderColor: "var(--cinnabar-soft)" }}
          >
            <h3 style={{ fontSize: "1rem", margin: "0 0 0.5rem" }}>
              {yjT("meihua.verdict", loc)} ·{" "}
              <span style={{ color: VERDICT_TONE[result.verdict.level] }}>
                {zT(result.verdict.level)}
              </span>
            </h3>
            <p style={{ margin: "0 0 0.4rem" }}>{zT(result.verdict.oneLiner)}</p>
            <p className="muted" style={{ margin: 0 }}>
              <QuoteRef entry={TIYONG_QUOTE} />
            </p>
          </div>

          {/* 卦象 */}
          <div style={{ display: "flex", gap: "1.2rem", alignItems: "flex-start", flexWrap: "wrap", marginTop: "1.2rem" }}>
            <HexFigure bits={ben.bits} moving={result.lines.map((v) => v === 6 || v === 9)} />
            <div style={{ flex: "1 1 220px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.7rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "2.6rem", lineHeight: 1 }}>{ben.symbol}</span>
                <span style={{ fontFamily: "var(--serif)", fontSize: "1.5rem" }}>
                  <Term term="本卦" /> · {zT(ben.name)}
                </span>
                <span className="muted">#{ben.number}</span>
              </div>
              <p style={{ marginTop: "0.4rem" }}>
                <span className="badge badge-warn">
                  {yjT("meihua.moving", loc)}: {zT(yaoName(ben, result.movingLine))}
                </span>
              </p>
              <p style={{ marginTop: "0.7rem" }}>
                <Term term="卦辭" />:{" "}
                <span style={{ fontFamily: "var(--serif)", fontSize: "1.05rem" }}>
                  {withTermHighlights(ben.judgment, zT)}
                </span>
              </p>
            </div>
          </div>

          {(bian || hu) && (
            <div className="grid-2" style={{ marginTop: "1.2rem" }}>
              {bian && (
                <div className="card" style={{ marginTop: 0 }}>
                  <h3 style={{ fontSize: "1rem", margin: "0 0 0.5rem" }}>
                    <span style={{ fontSize: "1.8rem", marginRight: "0.5rem" }}>{bian.symbol}</span>
                    <Term term="變卦" /> · {zT(bian.name)}
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.92rem" }}>
                    <Term term="卦辭" />: {withTermHighlights(bian.judgment, zT)}
                  </p>
                </div>
              )}
              {hu && (
                <div className="card" style={{ marginTop: 0 }}>
                  <h3 style={{ fontSize: "1rem", margin: "0 0 0.5rem" }}>
                    <span style={{ fontSize: "1.8rem", marginRight: "0.5rem" }}>{hu.symbol}</span>
                    <Term term="互卦" /> · {zT(hu.name)}
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.92rem" }}>
                    <Term term="卦辭" />: {withTermHighlights(hu.judgment, zT)}
                  </p>
                </div>
              )}
            </div>
          )}

          <AiInterpret hexagram={result.hexagram} lines={result.lines} locale={loc} />
        </div>
      )}
    </>
  );
}
