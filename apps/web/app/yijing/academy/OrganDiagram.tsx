"use client";

import { FigureOutline } from "./BodyDiagram";

/**
 * 人體內臟圖:五臟照五行(肝木、心火、脾土、肺金、腎水),
 * 每臟標返管佢嘅八卦。位置照前望人形擺:肺在胸上、心在左胸、
 * 肝在右腹(望者左)、脾在左腹(望者右)、腎在腰下。
 * 顏色一律經 style 入 var(--x),而且只用 theme 有定義嘅變數。
 */

const INK = "var(--ink)";
const ACCENT = "var(--cinnabar)";

interface OrganMark {
  zang: string;
  guas: string;
  x: number;
  y: number;
  tx: number;
  ty: number;
  anchor: "start" | "middle" | "end";
}

const ORGANS: OrganMark[] = [
  { zang: "肺", guas: "乾兌", x: 124, y: 76, tx: 140, ty: 80, anchor: "start" },
  { zang: "心", guas: "離", x: 99, y: 90, tx: 84, ty: 94, anchor: "end" },
  { zang: "肝", guas: "震巽", x: 95, y: 116, tx: 82, ty: 120, anchor: "end" },
  { zang: "脾", guas: "坤艮", x: 125, y: 116, tx: 140, ty: 120, anchor: "start" },
  { zang: "腎", guas: "坎", x: 110, y: 144, tx: 126, ty: 148, anchor: "start" },
];

export default function OrganDiagram({ active }: { active: string | null }) {
  return (
    <svg
      viewBox="0 0 220 226"
      role="img"
      aria-label="人體五臟對應圖"
      style={{ display: "block", width: "100%", maxWidth: "250px", margin: "0 auto" }}
    >
      <FigureOutline />
      {ORGANS.map((o) => {
        const on = active === o.zang;
        return (
          <g key={o.zang}>
            <circle
              cx={o.x}
              cy={o.y}
              r={on ? 7 : 5.5}
              style={{ fill: on ? ACCENT : "var(--card)", stroke: on ? ACCENT : "var(--ink-soft)" }}
              strokeWidth="1.6"
            />
            <text
              x={o.tx}
              y={o.ty}
              textAnchor={o.anchor}
              fontSize="11.5"
              fontWeight={on ? 800 : 600}
              style={{ fill: on ? ACCENT : INK }}
            >
              {o.guas}・{o.zang}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
