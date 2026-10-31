"use client";

import { FigureOutline } from "./BodyDiagram";

/**
 * 人體內臟圖:五臟照五行(肝木、心火、脾土、肺金、腎水),
 * 每臟標返管佢嘅八卦。位置照解剖(人形面向望者):
 * 肺一對,在胸腔上部左右;心在胸中、偏人物左邊(望者右);
 * 肝在人物右上腹(望者左)、脾在人物左上腹(望者右);
 * 腎一對,在腰部脊柱兩旁(軀幹內下部,唔係盆腔)。
 * 顏色一律經 style 入 var(--x),而且只用 theme 有定義嘅變數。
 */

const INK = "var(--ink)";
const ACCENT = "var(--cinnabar)";

interface OrganMark {
  zang: string;
  guas: string;
  dots: [number, number][];
  tx: number;
  ty: number;
  anchor: "start" | "middle" | "end";
}

const ORGANS: OrganMark[] = [
  { zang: "肺", guas: "乾兌", dots: [[99, 74], [121, 74]], tx: 140, ty: 78, anchor: "start" },
  { zang: "心", guas: "離", dots: [[114, 90]], tx: 84, ty: 94, anchor: "end" },
  { zang: "肝", guas: "震巽", dots: [[96, 110]], tx: 82, ty: 114, anchor: "end" },
  { zang: "脾", guas: "坤艮", dots: [[124, 110]], tx: 140, ty: 114, anchor: "start" },
  { zang: "腎", guas: "坎", dots: [[100, 126], [120, 126]], tx: 140, ty: 130, anchor: "start" },
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
            {o.dots.map(([x, y], di) => (
              <circle
                key={di}
                cx={x}
                cy={y}
                r={on ? 7 : 5.5}
                style={{ fill: on ? ACCENT : "var(--card)", stroke: on ? ACCENT : "var(--ink-soft)" }}
                strokeWidth="1.6"
              />
            ))}
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
