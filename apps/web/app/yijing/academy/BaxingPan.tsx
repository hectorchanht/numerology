"use client";

import { useState } from "react";
import { useScript } from "@/lib/i18n";

type Element5 = "木" | "火" | "土" | "金" | "水";

interface Star {
  name: string;
  alias: string;
  element: Element5;
  lucky: boolean;
  /** 遊年爻變:由本宮卦變哪幾爻而成 */
  yaoChange: string;
  /** 兇星:以何吉星制化;吉星:其位之用 */
  use: string;
}

/**
 * 八宅八星(據道之光《天眼風水師》第487、892章):
 * 吉星——生氣貪狼木、天醫巨門土、延年武曲金、伏位輔弼木;
 * 兇星——絕命破軍金、五鬼廉貞火、六煞文曲水、禍害祿存土。
 * 遊年以爻變定星:三爻不動為伏位,三爻俱變為延年,變上爻生氣,變中爻絕命,
 * 變下爻禍害,變上二爻五鬼,變下二爻天醫,變上下爻六煞。
 * 化解(第892章):生氣木降五鬼火、天醫土制絕命金、延年金制六煞水,
 * 禍害兼用天醫與生氣化之——以吉制兇、修其所生以泄其兇,歸根結底修脾氣。
 */
const STARS: Star[] = [
  { name: "生氣", alias: "貪狼", element: "木", lucky: true, yaoChange: "變上爻", use: "四吉之首,宜增強其氣;亦可降五鬼(火)" },
  { name: "天醫", alias: "巨門", element: "土", lucky: true, yaoChange: "變下二爻", use: "吉星,宜增強其氣;可制絕命(金),兼化禍害" },
  { name: "延年", alias: "武曲", element: "金", lucky: true, yaoChange: "三爻俱變", use: "吉星,宜增強其氣;可制六煞(水)" },
  { name: "伏位", alias: "輔弼", element: "木", lucky: true, yaoChange: "三爻不動", use: "本宮之星,主平穩,宜守不宜動" },
  { name: "絕命", alias: "破軍", element: "金", lucky: false, yaoChange: "變中爻", use: "以天醫(土)制之:土生金,修其所生以泄其兇" },
  { name: "五鬼", alias: "廉貞", element: "火", lucky: false, yaoChange: "變上二爻", use: "以生氣(木)降之:木生火,泄其兇氣" },
  { name: "六煞", alias: "文曲", element: "水", lucky: false, yaoChange: "變上下爻", use: "以延年(金)制之:金生水,修其所生以泄其兇" },
  { name: "禍害", alias: "祿存", element: "土", lucky: false, yaoChange: "變下爻", use: "無專制之星,兼用天醫與生氣化之" },
];

const ELEMENT_STYLE: Record<Element5, { bg: string; fg: string; bd: string }> = {
  木: { bg: "#2e933c", fg: "#ffffff", bd: "#1e6b28" },
  火: { bg: "#e03131", fg: "#ffffff", bd: "#a61e1e" },
  金: { bg: "#f1f3f5", fg: "#343a40", bd: "#adb5bd" },
  水: { bg: "#212529", fg: "#ffffff", bd: "#000000" },
  土: { bg: "#eab308", fg: "#422006", bd: "#a16207" },
};

/** 互動八星盤:點星看別名、五行、爻變由來與制化之法 */
export function BaxingPan() {
  const { zT } = useScript();
  const [sel, setSel] = useState<number | null>(null);
  const s = sel !== null ? STARS[sel] : null;

  const group = (title: string, lucky: boolean) => (
    <div>
      <p style={{ fontSize: "0.8rem", fontWeight: 700, margin: "0.55rem 0 0.4rem", color: "var(--muted)" }}>{zT(title)}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
        {STARS.map((star, i) => {
          if (star.lucky !== lucky) return null;
          const st = ELEMENT_STYLE[star.element];
          const active = sel === i;
          return (
            <button
              key={star.name}
              onClick={() => setSel(active ? null : i)}
              aria-label={`${star.name} ${star.alias} ${star.element}`}
              style={{
                borderRadius: "10px",
                border: active ? "3px solid var(--cinnabar)" : `1.5px solid ${st.bd}`,
                background: st.bg,
                color: st.fg,
                cursor: "pointer",
                padding: "0.45rem 2px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0",
              }}
            >
              <span style={{ fontSize: "1rem", fontWeight: 800, lineHeight: 1.2 }}>{zT(star.name)}</span>
              <span style={{ fontSize: "0.66rem", opacity: 0.85 }}>
                {zT(star.alias)} · {zT(star.element)}
              </span>
            </button>
          );
        })}
      </div>
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
      <p style={{ textAlign: "center", fontWeight: 800, margin: "0 0 0.35rem" }}>{zT("八宅八星盤")}</p>
      <p className="muted" style={{ fontSize: "0.82rem", textAlign: "center", margin: 0 }}>
        {zT("點選任一星,看它的別名、五行、爻變由來與制化之法。")}
      </p>
      <div style={{ maxWidth: "420px", margin: "0 auto" }}>
        {group("四吉星", true)}
        {group("四兇星", false)}
      </div>

      {s ? (
        <dl
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "0.5rem",
            marginTop: "0.85rem",
            marginBottom: 0,
          }}
        >
          {[
            [zT("星名 / 別名"), `${zT(s.name)} · ${zT(s.alias)}`],
            [zT("五行 / 吉兇"), `${zT(s.element)} / ${s.lucky ? zT("吉星") : zT("兇星")}`],
            [zT("爻變由來"), zT(s.yaoChange)],
            [s.lucky ? zT("運用") : zT("制化"), zT(s.use)],
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
              <dd style={{ margin: 0, fontSize: "0.94rem", fontWeight: 700 }}>{v}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="muted" style={{ fontSize: "0.85rem", textAlign: "center", marginTop: "0.9rem", marginBottom: 0 }}>
          {zT("遊年歌訣:三爻不動本伏位,三爻俱變延年金;上一爻變為生氣,中爻獨變系破軍。")}
        </p>
      )}
      <p className="muted" style={{ fontSize: "0.8rem", textAlign: "center", marginTop: "0.7rem", marginBottom: 0 }}>
        {zT("化解總原則:以吉制兇,修其所生、泄其兇氣;歸根結底,修的是自己的脾氣。")}
      </p>
    </div>
  );
}
