"use client";

import { useState } from "react";
import { useScript } from "@/lib/i18n";

type Element5 = "木" | "火" | "金" | "水" | "土";

interface BranchNode {
  zhi: string;
  animal: string;
  /** 時辰,24 小時制 */
  time: string;
  element: Element5;
  direction: string;
  season: string;
  x: number;
  y: number;
}

const ELEMENT_STYLE: Record<Element5, { bg: string; fg: string; bd: string }> = {
  木: { bg: "#2e933c", fg: "#ffffff", bd: "#1e6b28" },
  火: { bg: "#e03131", fg: "#ffffff", bd: "#a61e1e" },
  金: { bg: "#f1f3f5", fg: "#343a40", bd: "#adb5bd" },
  水: { bg: "#212529", fg: "#ffffff", bd: "#000000" },
  土: { bg: "#eab308", fg: "#422006", bd: "#a16207" },
};

/** 十二地支掌訣:節點座標對應指節位置(上南下北,左東右西) */
const BRANCHES: BranchNode[] = [
  { zhi: "子", animal: "鼠", time: "23–1", element: "水", direction: "北", season: "冬", x: 200, y: 318 },
  { zhi: "丑", animal: "牛", time: "1–3", element: "土", direction: "東北", season: "冬", x: 252, y: 318 },
  { zhi: "寅", animal: "虎", time: "3–5", element: "木", direction: "東北", season: "春", x: 148, y: 310 },
  { zhi: "卯", animal: "兔", time: "5–7", element: "木", direction: "東", season: "春", x: 148, y: 252 },
  { zhi: "辰", animal: "龍", time: "7–9", element: "土", direction: "東南", season: "春", x: 148, y: 192 },
  { zhi: "巳", animal: "蛇", time: "9–11", element: "火", direction: "東南", season: "夏", x: 148, y: 132 },
  { zhi: "午", animal: "馬", time: "11–13", element: "火", direction: "南", season: "夏", x: 200, y: 112 },
  { zhi: "未", animal: "羊", time: "13–15", element: "土", direction: "西南", season: "夏", x: 252, y: 122 },
  { zhi: "申", animal: "猴", time: "15–17", element: "金", direction: "西南", season: "秋", x: 302, y: 164 },
  { zhi: "酉", animal: "雞", time: "17–19", element: "金", direction: "西", season: "秋", x: 302, y: 218 },
  { zhi: "戌", animal: "狗", time: "19–21", element: "土", direction: "西北", season: "秋", x: 302, y: 272 },
  { zhi: "亥", animal: "豬", time: "21–23", element: "水", direction: "西北", season: "冬", x: 302, y: 318 },
];

const BRANCH_ORDER = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

function currentBranchZhi(): string {
  const h = new Date().getHours();
  const i = h === 23 ? 0 : Math.floor((h + 1) / 2) % 12;
  return BRANCH_ORDER[i];
}

interface MagicCell {
  n: number;
  gua: string;
  element: Element5;
  direction: string;
}

/** 洛書九宮:4 9 2 / 3 5 7 / 8 1 6 */
const MAGIC: MagicCell[] = [
  { n: 4, gua: "巽", element: "木", direction: "東南" },
  { n: 9, gua: "離", element: "火", direction: "南" },
  { n: 2, gua: "坤", element: "土", direction: "西南" },
  { n: 3, gua: "震", element: "木", direction: "東" },
  { n: 5, gua: "中宮", element: "土", direction: "中央" },
  { n: 7, gua: "兌", element: "金", direction: "西" },
  { n: 8, gua: "艮", element: "土", direction: "東北" },
  { n: 1, gua: "坎", element: "水", direction: "北" },
  { n: 6, gua: "乾", element: "金", direction: "西北" },
];

/** 互動掌中訣:SVG 手掌 + 九宮格,附「現在時辰」 */
export function PalmDiagram() {
  const { zT } = useScript();
  const [tab, setTab] = useState<"palm" | "magic">("palm");
  const [sel, setSel] = useState<BranchNode | null>(null);
  const [selMagic, setSelMagic] = useState<MagicCell | null>(null);

  const tabBtn = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "0.55rem 0",
    borderRadius: "10px",
    border: active ? "1px solid var(--cinnabar)" : "1px solid var(--line)",
    background: active ? "var(--cinnabar-soft)" : "transparent",
    color: "var(--ink)",
    fontSize: "0.95rem",
    cursor: "pointer",
  });

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
      <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1rem" }}>
        <button style={tabBtn(tab === "palm")} onClick={() => setTab("palm")}>
          {zT("掌中訣")}
        </button>
        <button style={tabBtn(tab === "magic")} onClick={() => setTab("magic")}>
          {zT("九宮格")}
        </button>
      </div>

      {tab === "palm" && (
        <>
          <svg
            viewBox="0 0 400 540"
            style={{ width: "100%", maxWidth: "340px", display: "block", margin: "0 auto" }}
            role="img"
            aria-label={zT("十二地支掌中訣示意圖")}
          >
            {/* 手掌 */}
            <g fill="var(--card)" stroke="var(--line)" strokeWidth="2">
              <rect x="128" y="118" width="40" height="196" rx="18" />
              <rect x="180" y="96" width="40" height="218" rx="18" />
              <rect x="232" y="106" width="40" height="208" rx="18" />
              <rect x="284" y="148" width="36" height="172" rx="16" />
              <rect x="112" y="300" width="208" height="192" rx="52" />
              <rect x="44" y="352" width="104" height="42" rx="21" transform="rotate(-24 96 373)" />
            </g>
            {/* 方位季節標註:上南下北,左東右西 */}
            <g fill="var(--muted)" fontSize="13" textAnchor="middle">
              <text x="200" y="62">{zT("夏 · 南")}</text>
              <text x="200" y="528">{zT("冬 · 北")}</text>
              <text x="34" y="300">{zT("春 · 東")}</text>
              <text x="368" y="300">{zT("秋 · 西")}</text>
            </g>
            {/* 地支節點 */}
            {BRANCHES.map((b) => {
              const st = ELEMENT_STYLE[b.element];
              const active = sel?.zhi === b.zhi;
              return (
                <g
                  key={b.zhi}
                  onClick={() => setSel(b)}
                  style={{ cursor: "pointer" }}
                  role="button"
                  aria-label={`${b.zhi} ${b.animal} ${b.time}`}
                >
                  <circle
                    cx={b.x}
                    cy={b.y}
                    r={active ? 20 : 17}
                    fill={st.bg}
                    stroke={active ? "var(--cinnabar)" : st.bd}
                    strokeWidth={active ? 3.5 : 1.5}
                  />
                  <text
                    x={b.x}
                    y={b.y + 6}
                    textAnchor="middle"
                    fontSize="16"
                    fontWeight="700"
                    fill={st.fg}
                    style={{ pointerEvents: "none", userSelect: "none" }}
                  >
                    {b.zhi}
                  </text>
                </g>
              );
            })}
          </svg>

          <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.8rem", flexWrap: "wrap" }}>
            <button
              className="btn ghost"
              style={{ fontSize: "0.85rem", padding: "0.45rem 0.9rem" }}
              onClick={() => {
                const zhi = currentBranchZhi();
                setSel(BRANCHES.find((b) => b.zhi === zhi) ?? null);
              }}
            >
              {zT("現在時辰")}
            </button>
            {sel && (
              <button
                className="btn ghost"
                style={{ fontSize: "0.85rem", padding: "0.45rem 0.9rem" }}
                onClick={() => setSel(null)}
              >
                {zT("清除")}
              </button>
            )}
          </div>

          {sel ? (
            <dl
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "0.5rem",
                marginTop: "0.9rem",
                marginBottom: 0,
              }}
            >
              {[
                [zT("地支"), `${sel.zhi}`],
                [zT("生肖"), sel.animal],
                [zT("時辰"), `${sel.time} ${zT("點")}`],
                [zT("五行"), sel.element],
                [zT("方位"), sel.direction],
                [zT("季節"), sel.season],
              ].map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    border: "1px solid var(--line)",
                    borderRadius: "10px",
                    padding: "0.5rem 0.6rem",
                    background: "var(--card)",
                  }}
                >
                  <dt style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{k}</dt>
                  <dd style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>{v}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="muted" style={{ fontSize: "0.85rem", marginTop: "0.9rem", marginBottom: 0 }}>
              {zT("點選手掌上的地支節點,查看時辰、生肖、五行、方位。")}
            </p>
          )}
        </>
      )}

      {tab === "magic" && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "8px",
              maxWidth: "300px",
              margin: "0 auto",
            }}
          >
            {MAGIC.map((c) => {
              const st = ELEMENT_STYLE[c.element];
              const active = selMagic?.n === c.n;
              return (
                <button
                  key={c.n}
                  onClick={() => setSelMagic(c)}
                  style={{
                    aspectRatio: "1",
                    borderRadius: "12px",
                    border: active ? "3px solid var(--cinnabar)" : `1.5px solid ${st.bd}`,
                    background: st.bg,
                    color: st.fg,
                    fontSize: "1.6rem",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                  aria-label={`${c.n} ${c.gua}`}
                >
                  {c.n}
                </button>
              );
            })}
          </div>
          <p
            style={{
              textAlign: "center",
              fontSize: "0.95rem",
              letterSpacing: "0.08em",
              marginTop: "0.9rem",
              marginBottom: "0.4rem",
            }}
          >
            {zT("戴九履一,左三右七,四二為肩,八六為足。")}
          </p>
          {selMagic ? (
            <dl
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "0.5rem",
                marginTop: "0.8rem",
                marginBottom: 0,
              }}
            >
              {[
                [zT("數字"), String(selMagic.n)],
                [zT("卦名"), selMagic.gua],
                [zT("五行"), selMagic.element],
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
                  <dd style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>{v}</dd>
                </div>
              ))}
              <div
                style={{
                  border: "1px solid var(--line)",
                  borderRadius: "10px",
                  padding: "0.5rem 0.6rem",
                  background: "var(--card)",
                  textAlign: "center",
                  gridColumn: "1 / -1",
                }}
              >
                <dt style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{zT("方位")}</dt>
                <dd style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>{selMagic.direction}</dd>
              </div>
            </dl>
          ) : (
            <p className="muted" style={{ fontSize: "0.85rem", textAlign: "center", marginBottom: 0 }}>
              {zT("點選九宮格中的數字,查看卦名、五行、方位。")}
            </p>
          )}
        </>
      )}
    </div>
  );
}
