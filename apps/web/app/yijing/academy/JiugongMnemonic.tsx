"use client";

import { useState } from "react";
import { useScript } from "@/lib/i18n";

type Element5 = "木" | "火" | "土" | "金" | "水";

interface Palace {
  gua: string;
  symbol: string;
  num: number;
  dir: string;
  element: Element5;
  season: string;
}

/**
 * 九宮五行速記(據道之光《天眼風水師》第114、175章):
 * 四季五行入九宮——春木(東、東南,綠)、夏火(南,紅)、秋金(西、西北,白)、
 * 冬水(北,黑)、四季土(中、西南、東北,黃)。
 * 生剋以五角星記:順時針相鄰為相生,隔位為相剋。
 */
const PALACES: Palace[] = [
  { gua: "巽", symbol: "☴", num: 4, dir: "東南", element: "木", season: "春" },
  { gua: "離", symbol: "☲", num: 9, dir: "南", element: "火", season: "夏" },
  { gua: "坤", symbol: "☷", num: 2, dir: "西南", element: "土", season: "四季" },
  { gua: "震", symbol: "☳", num: 3, dir: "東", element: "木", season: "春" },
  { gua: "中", symbol: "☯", num: 5, dir: "中宮", element: "土", season: "四季" },
  { gua: "兌", symbol: "☱", num: 7, dir: "西", element: "金", season: "秋" },
  { gua: "艮", symbol: "☶", num: 8, dir: "東北", element: "土", season: "四季" },
  { gua: "坎", symbol: "☵", num: 1, dir: "北", element: "水", season: "冬" },
  { gua: "乾", symbol: "☰", num: 6, dir: "西北", element: "金", season: "秋" },
];

const ELEMENT_STYLE: Record<Element5, { bg: string; fg: string; bd: string }> = {
  木: { bg: "#2e933c", fg: "#ffffff", bd: "#1e6b28" },
  火: { bg: "#e03131", fg: "#ffffff", bd: "#a61e1e" },
  金: { bg: "#f1f3f5", fg: "#343a40", bd: "#adb5bd" },
  水: { bg: "#212529", fg: "#ffffff", bd: "#000000" },
  土: { bg: "#eab308", fg: "#422006", bd: "#a16207" },
};

/** 相生:木→火→土→金→水→木 */
const SHENG: Record<Element5, Element5> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
/** 相剋:木→土→水→火→金→木 */
const KE: Record<Element5, Element5> = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };

const SHENG_MEMO: Record<Element5, string> = {
  水: "冬天的水,生春天的木",
  木: "木燃燒,而生火",
  火: "火燒完,生成土灰",
  土: "沙中淘金,金礦從土裏挖出",
  金: "金屬熔化成金水",
};
const KE_MEMO: Record<Element5, string> = {
  水: "水能滅火",
  火: "火把金熔成金水",
  金: "斧、鋸等金屬製品能伐木",
  木: "破土而出",
  土: "水來土掩",
};

function parentOf(el: Element5): Element5 {
  return (Object.keys(SHENG) as Element5[]).find((k) => SHENG[k] === el)!;
}
function controllerOf(el: Element5): Element5 {
  return (Object.keys(KE) as Element5[]).find((k) => KE[k] === el)!;
}

/** 互動九宮速記:點宮看五行、生剋與書中助記語 */
export function JiugongMnemonic() {
  const { zT } = useScript();
  const [sel, setSel] = useState<number | null>(null);
  const p = sel !== null ? PALACES[sel] : null;

  const cycleRow = (label: string, order: Element5[], memo: Record<Element5, string>, activeEl: Element5 | null) => (
    <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap", justifyContent: "center" }}>
      <span style={{ fontSize: "0.78rem", fontWeight: 700, marginRight: "2px" }}>{zT(label)}</span>
      {order.map((el, i) => (
        <span key={el} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
          <span
            style={{
              padding: "2px 9px",
              borderRadius: "999px",
              background: ELEMENT_STYLE[el].bg,
              color: ELEMENT_STYLE[el].fg,
              border: `1.5px solid ${ELEMENT_STYLE[el].bd}`,
              fontSize: "0.82rem",
              fontWeight: 800,
              outline: activeEl === el ? "2.5px solid var(--cinnabar)" : "none",
            }}
          >
            {zT(el)}
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{i < order.length - 1 ? "→" : "↺"}</span>
        </span>
      ))}
      <span className="muted" style={{ fontSize: "0.75rem", width: "100%", textAlign: "center" }}>
        {activeEl ? zT(memo[activeEl]) : ""}
      </span>
    </div>
  );

  return (
    <div
      style={{
        border: "1px solid var(--line)",
        borderRadius: "14px",
        padding: "1rem",
        margin: "1.2rem 0",
        background: "var(--bg-soft)",
      }}
    >
      <p style={{ textAlign: "center", fontWeight: 800, margin: "0 0 0.35rem" }}>{zT("九宮五行方位速記")}</p>
      <p className="muted" style={{ fontSize: "0.82rem", textAlign: "center", margin: "0 0 0.8rem" }}>
        {zT("春天木、夏天火、秋季金、冬天水,四季土。點選任一宮,看它的五行與生剋。")}
      </p>

      {/* minmax(0,1fr):同 BaguaFamilyGrid——aspectRatio 格仔內容高度會變欄闊下限,窄機撐爆 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "8px",
          width: "100%",
          maxWidth: "340px",
          margin: "0 auto",
        }}
      >
        {PALACES.map((cell, i) => {
          const st = ELEMENT_STYLE[cell.element];
          const active = sel === i;
          return (
            <button
              key={i}
              onClick={() => setSel(active ? null : i)}
              aria-label={`${cell.gua} ${cell.num}宮 ${cell.dir} ${cell.element}`}
              style={{
                aspectRatio: "1",
                minWidth: 0,
                borderRadius: "12px",
                border: active ? "3px solid var(--cinnabar)" : `1.5px solid ${st.bd}`,
                background: st.bg,
                color: st.fg,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "1px",
                padding: "4px",
                position: "relative",
              }}
            >
              <span style={{ position: "absolute", top: "4px", left: "7px", fontSize: "0.72rem", fontWeight: 800, opacity: 0.85 }}>
                {cell.num}
              </span>
              <span style={{ fontSize: "0.66rem", opacity: 0.85 }}>{zT(cell.dir)}</span>
              <span style={{ fontSize: "1.45rem", fontWeight: 800, lineHeight: 1.15 }}>
                {cell.gua} <span style={{ fontSize: "1.05rem" }}>{cell.symbol}</span>
              </span>
              <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>
                {zT(cell.element)} · {zT(cell.season)}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem", marginTop: "0.9rem" }}>
        {cycleRow("相生", ["木", "火", "土", "金", "水"], SHENG_MEMO, p?.element ?? null)}
        {cycleRow("相剋", ["木", "土", "水", "火", "金"], KE_MEMO, p?.element ?? null)}
      </div>

      {p ? (
        <dl
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "0.5rem",
            marginTop: "0.85rem",
            marginBottom: 0,
          }}
        >
          {[
            [zT("此宮"), `${p.gua} ${p.symbol} · ${p.num}宮 · ${zT(p.dir)}`],
            [zT("五行 / 季節"), `${zT(p.element)} / ${zT(p.season)}`],
            [zT("生我(母)"), `${zT(parentOf(p.element))} — ${zT(SHENG_MEMO[parentOf(p.element)])}`],
            [zT("我生(子)"), `${zT(SHENG[p.element])} — ${zT(SHENG_MEMO[p.element])}`],
            [zT("剋我"), `${zT(controllerOf(p.element))} — ${zT(KE_MEMO[controllerOf(p.element)])}`],
            [zT("我剋"), `${zT(KE[p.element])} — ${zT(KE_MEMO[p.element])}`],
          ].map(([k, v]) => (
            <div
              key={k}
              style={{
                border: "1px solid var(--line)",
                borderRadius: "10px",
                padding: "0.5rem 0.6rem",
                background: "var(--card)",
                textAlign: "center",
              }}
            >
              <dt style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{k}</dt>
              <dd style={{ margin: 0, fontSize: "0.92rem", fontWeight: 700 }}>{v}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="muted" style={{ fontSize: "0.85rem", textAlign: "center", marginTop: "0.9rem", marginBottom: 0 }}>
          {zT("五角星速記:順時針相鄰為相生,隔一位為相剋——挨着自己的都是自己人,不挨着的便是相剋。")}
        </p>
      )}
    </div>
  );
}
