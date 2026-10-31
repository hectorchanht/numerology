"use client";

/**
 * 人體外觀圖:八卦配人體部位(《說卦傳》:乾首、坤腹、震足、巽股、
 * 坎耳、離目、艮手、兌口)。企喺度由頭到腳嘅位置畫晒出嚟,
 * 學生一望就知邊卦管邊度;選中一卦,佢嗰個部位會亮起朱砂色。
 */

interface PartMark {
  part: string;
  gua: string;
  x: number;
  y: number;
  /** 標籤擺點(同點位分開,免同身軀重疊) */
  tx: number;
  ty: number;
  anchor: "start" | "middle" | "end";
}

const PARTS: PartMark[] = [
  { part: "首", gua: "乾", x: 110, y: 17, tx: 110, ty: 9, anchor: "middle" },
  { part: "目", gua: "離", x: 110, y: 31, tx: 82, ty: 28, anchor: "end" },
  { part: "耳", gua: "坎", x: 128, y: 34, tx: 140, ty: 30, anchor: "start" },
  { part: "口", gua: "兌", x: 110, y: 45, tx: 82, ty: 50, anchor: "end" },
  { part: "手", gua: "艮", x: 61, y: 124, tx: 52, ty: 128, anchor: "end" },
  { part: "腹", gua: "坤", x: 110, y: 100, tx: 142, ty: 104, anchor: "start" },
  { part: "股", gua: "巽", x: 96, y: 162, tx: 84, ty: 166, anchor: "end" },
  { part: "足", gua: "震", x: 131, y: 208, tx: 142, ty: 212, anchor: "start" },
];

export default function BodyDiagram({ active }: { active: string | null }) {
  const ink = "var(--ink)";
  // 注意:呢個 theme 根本冇 --muted 變數(得 --ink-soft/--ink-faint),
  // 用 var(--muted) 會成條 declaration invalid、靜靜跌返 unset。
  const muted = "var(--ink-soft)";
  const accent = "var(--cinnabar)";
  return (
    <svg
      viewBox="0 0 220 226"
      role="img"
      aria-label="人體八卦對應圖"
      style={{ display: "block", width: "100%", maxWidth: "250px", margin: "0 auto" }}
    >
      {/* 身軀(簡筆人形)。顏色一律經 style 入 var(--x)(較穩陣);
          而且只准用 theme 真係有定義嘅變數,見上面 muted 註解。 */}
      <g style={{ stroke: muted }} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.75">
        <circle cx="110" cy="34" r="17" />
        <rect x="88" y="54" width="44" height="78" rx="14" />
        <path d="M88 62 L63 120" />
        <path d="M132 62 L157 120" />
        <path d="M97 132 L91 202" />
        <path d="M123 132 L129 202" />
        <path d="M82 208 L98 208" />
        <path d="M122 208 L138 208" />
      </g>
      {/* 眼睛(示意) */}
      <circle cx="104" cy="32" r="1.6" style={{ fill: muted }} />
      <circle cx="116" cy="32" r="1.6" style={{ fill: muted }} />
      {PARTS.map((p) => {
        const on = active === p.part;
        return (
          <g key={p.part}>
            <circle
              cx={p.x}
              cy={p.y}
              r={on ? 6 : 4.5}
              style={{ fill: on ? accent : "var(--card)", stroke: on ? accent : muted }}
              strokeWidth="1.6"
            />
            <text
              x={p.tx}
              y={p.ty}
              textAnchor={p.anchor}
              fontSize="11.5"
              fontWeight={on ? 800 : 600}
              style={{ fill: on ? accent : ink }}
            >
              {p.gua}・{p.part}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
