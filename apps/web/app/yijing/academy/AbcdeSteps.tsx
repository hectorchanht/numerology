"use client";

import { useState } from "react";
import { useScript } from "@/lib/i18n";

/**
 * 理性情緒療法(REBT)ABCDE 五步(據道之光《天眼風水師》第186章):
 * A 誘發事件、B 信念、C 後果(情緒與行為)、D 質疑(與原信念辯論重解)、
 * E 效果(積極的情緒與行為)。核心:困擾源於信念,而非事件本身。
 * 示例為一般教學例子:考試落榜。
 */
const STEPS = [
  { k: "A", name: "誘發事件", desc: "發生了甚麼事,只記事實", eg: "考試落榜,未獲取錄" },
  { k: "B", name: "信念", desc: "自己如何評價、解釋這件事", eg: "「落榜即是我無用,前途完了」" },
  { k: "C", name: "後果", desc: "由此而來的情緒與行為", eg: "沮喪、自責,逃避不再準備" },
  { k: "D", name: "質疑", desc: "與原信念辯論,重新解讀", eg: "一次落榜不等於無用;落榜的人很多,路不止一條" },
  { k: "E", name: "新效果", desc: "換了信念後的情緒與行為", eg: "平靜下來,訂新計劃,重新出發" },
];

/** 互動 ABCDE 步驟圖:點每一步看說明與示例 */
export function AbcdeSteps() {
  const { zT } = useScript();
  const [sel, setSel] = useState(1); // 預設停在 B:信念是關鍵
  const s = STEPS[sel];

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
      <p style={{ textAlign: "center", fontWeight: 800, margin: "0 0 0.35rem" }}>{zT("ABCDE 五步圖")}</p>
      <p className="muted" style={{ fontSize: "0.82rem", textAlign: "center", margin: "0 0 0.7rem" }}>
        {zT("理性情緒療法:困擾我們的往往不是事件(A),而是信念(B)。點每一步看示例。")}
      </p>
      <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap" }}>
        {STEPS.map((step, i) => (
          <button
            key={step.k}
            onClick={() => setSel(i)}
            aria-label={`${step.k} ${step.name}`}
            style={{
              borderRadius: "10px",
              border: sel === i ? "3px solid var(--cinnabar)" : "1.5px solid var(--line)",
              background: "var(--card)",
              color: "var(--ink)",
              cursor: "pointer",
              padding: "0.5rem 0.55rem",
              minWidth: "60px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "1.15rem", fontWeight: 800, lineHeight: 1.1 }}>{step.k}</span>
            <span style={{ fontSize: "0.72rem" }}>{zT(step.name)}</span>
          </button>
        ))}
      </div>
      <div
        style={{
          border: "1px solid var(--line)",
          borderRadius: "10px",
          padding: "0.7rem 0.8rem",
          background: "var(--card)",
          marginTop: "0.8rem",
          textAlign: "center",
        }}
      >
        <p style={{ margin: "0 0 0.3rem", fontWeight: 700 }}>
          {s.k} · {zT(s.name)}
        </p>
        <p className="muted" style={{ margin: "0 0 0.3rem", fontSize: "0.88rem" }}>{zT(s.desc)}</p>
        <p style={{ margin: 0, fontSize: "0.92rem" }}>
          {zT("例:")} {zT(s.eg)}
        </p>
      </div>
    </div>
  );
}
