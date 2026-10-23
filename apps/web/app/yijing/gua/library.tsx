"use client";

import { useEffect, useMemo, useState } from "react";
import {
  allHexagrams,
  getHexagram,
  searchHexagrams,
  yaoName,
  interpOf,
  TRIGRAM_INFO,
  type Hexagram,
  type YijingInterp,
  type YijingLocale,
} from "@numerology/knowledge";
import { useLocale, useScript } from "@/lib/i18n";
import { yjT, type YijingLocale as YL } from "@/lib/yijingStrings";
import { Term, withTermHighlights } from "@/lib/highlightTerms";
import { useQueryParam, useSetQueryParams, useDetailCloser } from "@/lib/useQueryParams";

const TABS = ["coreMeaning", "career", "love", "wealth", "health", "advice"] as const;
const TAB_IDS: Record<(typeof TABS)[number], string> = {
  coreMeaning: "gua.interp.core",
  career: "gua.interp.career",
  love: "gua.interp.love",
  wealth: "gua.interp.wealth",
  health: "gua.interp.health",
  advice: "gua.interp.advice",
};

function TrigramTag({ name, loc }: { name: keyof typeof TRIGRAM_INFO; loc: YijingLocale }) {
  const info = TRIGRAM_INFO[name];
  const { zT } = useScript();
  return (
    <span
      className="badge"
      title={`${info.pinyin} · ${info.en} · ${info.nature} · ${info.element}`}
    >
      {info.symbol} {zT(name)}
    </span>
  );
}

function Detail({ hex, loc, onBack }: { hex: Hexagram; loc: YL; onBack: () => void }) {
  // 詳情內 tab 落 URL(?tab=),分享連結還原埋睇緊邊個 tab
  const tabParam = useQueryParam("tab");
  const setParams = useSetQueryParams();
  const tab: (typeof TABS)[number] = (TABS as readonly string[]).includes(tabParam ?? "")
    ? (tabParam as (typeof TABS)[number])
    : "coreMeaning";
  const setTab = (t: (typeof TABS)[number]) =>
    setParams({ tab: t === "coreMeaning" ? null : t }, "replace");
  const interp: YijingInterp = interpOf(hex, loc as YijingLocale);
  // 卦爻辭 / 大象係繁體正本 → zT(只喺 zhs 轉);interp 已按 locale 出
  const { zT } = useScript();
  return (
    <div className="card">
      <button className="btn ghost" onClick={onBack} style={{ marginBottom: "1rem" }}>
        {yjT("gua.detail.back", loc)}
      </button>
      <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap" }}>
        <span style={{ fontSize: "3.4rem", lineHeight: 1 }}>{hex.symbol}</span>
        <div style={{ flex: "1 1 200px", minWidth: 0 }}>
          <h2 style={{ margin: "0 0 0.2rem", fontSize: "1.7rem" }}>
            {zT(hex.name)}
            <span className="muted" style={{ fontSize: "0.85rem", marginLeft: "0.6rem" }}>
              #{hex.number} · {hex.pinyin} · {hex.nameEn}
            </span>
          </h2>
          <div className="strip" style={{ gap: "0.4rem", alignItems: "center", margin: "0.5rem 0 0", padding: "2px 0" }}>
            <span className="muted">
              {yjT("gua.upper", loc)}:
            </span>
            <TrigramTag name={hex.upperTrigram} loc={loc} />
            <span className="muted">{yjT("gua.lower", loc)}:</span>
            <TrigramTag name={hex.lowerTrigram} loc={loc} />
            <span className="badge">
              {yjT("gua.element", loc)} {zT(hex.element)}
            </span>
            <span className="badge">
              {yjT("gua.yinyang", loc)} {zT(hex.yinYang)}
            </span>
          </div>
        </div>
      </div>

      <h3 className="section-title" style={{ marginTop: "1.4rem" }}>
        <Term term="卦辭" />
      </h3>
      <p style={{ fontFamily: "var(--serif)", fontSize: "1.05rem", marginTop: 0 }}>
        {withTermHighlights(hex.judgment, zT)}
      </p>

      <h3 className="section-title">
        <Term term="爻辭" />
      </h3>
      <div>
        {[...hex.lines].reverse().map((text, ri) => {
          const pos = 6 - ri;
          return (
            <div
              key={pos}
              style={{
                display: "flex",
                gap: "0.8rem",
                padding: "0.45rem 0",
                borderBottom: "1px dashed var(--line)",
              }}
            >
              <span
                style={{
                  minWidth: "3.4em",
                  fontFamily: "var(--serif)",
                  color: "var(--cinnabar)",
                }}
              >
                {zT(yaoName(hex, pos))}
              </span>
              <span style={{ fontSize: "0.92rem" }}>{withTermHighlights(text, zT)}</span>
            </div>
          );
        })}
      </div>

      <h3 className="section-title" style={{ marginTop: "1.4rem" }}>
        <Term term="大象" />
      </h3>
      <blockquote
        style={{
          margin: "0.5rem 0",
          padding: "0.5rem 0.9rem",
          borderLeft: "3px solid var(--gold)",
          background: "var(--paper-2)",
          color: "var(--ink-soft)",
          fontSize: "0.92rem",
        }}
      >
        {withTermHighlights(hex.image, zT)}
      </blockquote>

      <h3 className="section-title" style={{ marginTop: "1.4rem" }}>
        {yjT("gua.interp", loc)}
      </h3>
      <div className="filter-chips" role="tablist">
        {TABS.map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            className="filter-chip"
            onClick={() => setTab(k)}
          >
            {yjT(TAB_IDS[k], loc)}
          </button>
        ))}
      </div>
      <p style={{ fontSize: "0.94rem", lineHeight: 1.8 }}>{withTermHighlights(interp[tab])}</p>
    </div>
  );
}

export default function GuaLibrary() {
  const { locale } = useLocale();
  const { zT } = useScript();
  const loc = locale as YL;
  const setParams = useSetQueryParams();
  const { markPushed, close } = useDetailCloser("/yijing/gua");

  // 搜尋 filter 落 URL(?q=):打字即時 replace,back/forward 跟返 URL
  const qParam = useQueryParam("q") ?? "";
  const [q, setQ] = useState(qParam);
  useEffect(() => {
    setQ((prev) => (prev === qParam ? prev : qParam));
  }, [qParam]);
  const onQ = (v: string) => {
    setQ(v);
    setParams({ q: v || null }, "replace");
  };

  // 卦詳情落 URL(?gua=<n>):開 push,閂 smart back
  const guaParam = useQueryParam("gua");
  const selected = guaParam ? Number(guaParam) : null;
  const openGua = (n: number) => {
    markPushed();
    setParams({ gua: String(n) }, "push");
  };

  const all = useMemo(() => allHexagrams(), []);
  const results = useMemo(() => searchHexagrams(q), [q]);
  const hex = selected != null && !Number.isNaN(selected) ? getHexagram(selected) : undefined;

  return (
    <>
      <div className="masthead">
        <h1>{yjT("gua.title", loc)}</h1>
        <div className="sub">{yjT("gua.sub", loc)}</div>
      </div>

      {hex ? (
        <Detail hex={hex} loc={loc} onBack={close} />
      ) : (
        <div className="card">
          <div className="field" style={{ marginBottom: "1.2rem" }}>
            <input
              value={q}
              onChange={(e) => onQ(e.target.value)}
              placeholder={yjT("gua.searchPh", loc)}
              aria-label={yjT("gua.searchPh", loc)}
            />
          </div>
          {results.length === 0 ? (
            <p className="muted">{yjT("gua.empty", loc)}</p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))",
                gap: "0.6rem",
              }}
            >
              {results.map((h: Hexagram) => (
                <button
                  key={h.number}
                  onClick={() => openGua(h.number)}
                  style={{
                    background: "var(--paper)",
                    borderRadius: "12px",
                    padding: "0.7rem 0.4rem",
                    minHeight: "88px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.25rem",
                  }}
                >
                  <span style={{ fontSize: "1.9rem", lineHeight: 1.2 }}>{h.symbol}</span>
                  <span style={{ fontFamily: "var(--serif)", fontSize: "0.92rem" }}>{zT(h.name)}</span>
                  <span className="muted" style={{ fontSize: "0.68rem" }}>
                    #{h.number}
                  </span>
                </button>
              ))}
            </div>
          )}
          <p className="muted" style={{ marginTop: "1rem", marginBottom: 0 }}>
            <Term term="文王卦序" /> · {all.length}
            {loc === "en" ? " hexagrams" : loc === "zhs" ? " 卦" : " 卦"}
          </p>
        </div>
      )}
    </>
  );
}
