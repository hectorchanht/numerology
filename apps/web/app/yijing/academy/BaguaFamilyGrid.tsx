"use client";

import { useState } from "react";
import { useScript } from "@/lib/i18n";

type Element5 = "木" | "火" | "金" | "水" | "土";

interface TrigramInfo {
  name: string;
  symbol: string;
  /** 三爻,下而上:true=陽,false=陰 */
  lines: [boolean, boolean, boolean];
  nature: string;
  element: Element5;
  family: string;
  /** 一索/再索/三索(說卦傳);乾坤為純卦 */
  suo: string;
  /** 先天八卦相對的對卦(說卦傳:天地定位、山澤通氣、雷風相薄、水火不相射) */
  opposite: string;
}

/**
 * 八卦本體資料:卦形/自然象/五行/家族,據《說卦傳》核實。
 * 先天方位:乾南坤北、離東坎西、震東北、兌東南、巽西南、艮西北
 * (相對之卦陰陽互補,此為驗圖準則)。
 * 後天方位即洛書九宮:巽4東南、離9南、坤2西南、震3東、兌7西、艮8東北、坎1北、乾6西北。
 */
const TRIGRAMS: Record<string, TrigramInfo> = {
  乾: { name: "乾", symbol: "☰", lines: [true, true, true], nature: "天", element: "金", family: "父", suo: "純陽", opposite: "坤" },
  坤: { name: "坤", symbol: "☷", lines: [false, false, false], nature: "地", element: "土", family: "母", suo: "純陰", opposite: "乾" },
  震: { name: "震", symbol: "☳", lines: [true, false, false], nature: "雷", element: "木", family: "長男", suo: "一索", opposite: "巽" },
  巽: { name: "巽", symbol: "☴", lines: [false, true, true], nature: "風", element: "木", family: "長女", suo: "一索", opposite: "震" },
  坎: { name: "坎", symbol: "☵", lines: [false, true, false], nature: "水", element: "水", family: "中男", suo: "再索", opposite: "離" },
  離: { name: "離", symbol: "☲", lines: [true, false, true], nature: "火", element: "火", family: "中女", suo: "再索", opposite: "坎" },
  艮: { name: "艮", symbol: "☶", lines: [false, false, true], nature: "山", element: "土", family: "少男", suo: "三索", opposite: "兌" },
  兌: { name: "兌", symbol: "☱", lines: [true, true, false], nature: "澤", element: "金", family: "少女", suo: "三索", opposite: "艮" },
};

/** 九宮格位(上南下北,左東右西),左至右、上至下 */
const DIRECTIONS = ["東南", "南", "西南", "東", "中", "西", "東北", "北", "西北"];

/** 先天八卦座位(已按說卦傳相對互補原則核實) */
const XIAN_TIAN: (string | null)[] = ["兌", "乾", "巽", "離", null, "坎", "震", "坤", "艮"];

/** 後天八卦座位 + 洛書數 */
const HOU_TIAN: (string | null)[] = ["巽", "離", "坤", "震", null, "兌", "艮", "坎", "乾"];
const LUOSHU: (number | null)[] = [4, 9, 2, 3, 5, 7, 8, 1, 6];

const ELEMENT_STYLE: Record<Element5, { bg: string; fg: string; bd: string }> = {
  木: { bg: "#2e933c", fg: "#ffffff", bd: "#1e6b28" },
  火: { bg: "#e03131", fg: "#ffffff", bd: "#a61e1e" },
  金: { bg: "#f1f3f5", fg: "#343a40", bd: "#adb5bd" },
  水: { bg: "#212529", fg: "#ffffff", bd: "#000000" },
  土: { bg: "#eab308", fg: "#422006", bd: "#a16207" },
};

/** 獨特爻位置(下而上 0-2);純卦回傳 -1 */
function uniqueLineIndex(t: TrigramInfo): number {
  const [a, b, c] = t.lines;
  if (a === b && b === c) return -1;
  if (a !== b && a !== c) return 0;
  if (b !== a && b !== c) return 1;
  return 2;
}

/** 單爻圖形:陽爻一整橫,陰爻兩截;獨特爻以朱砂色標示 */
function YaoLine({ yang, unique }: { yang: boolean; unique: boolean }) {
  const color = unique ? "var(--cinnabar)" : "var(--ink)";
  const bar: React.CSSProperties = { height: "7px", borderRadius: "3px", background: color, flex: 1 };
  return yang ? (
    <div style={{ display: "flex" }}>
      <div style={bar} />
    </div>
  ) : (
    <div style={{ display: "flex", gap: "18%" }}>
      <div style={bar} />
      <div style={bar} />
    </div>
  );
}

/** 互動八卦家庭格:先天/後天一掣切換,點格看爻象、家族、五行、方位 */
export function BaguaFamilyGrid() {
  const { zT } = useScript();
  const [mode, setMode] = useState<"xian" | "hou">("xian");
  const [sel, setSel] = useState<string | null>(null);

  const seats = mode === "xian" ? XIAN_TIAN : HOU_TIAN;
  const selInfo = sel ? TRIGRAMS[sel] : null;
  const selPos = sel ? seats.indexOf(sel) : -1;
  const selUnique = selInfo ? uniqueLineIndex(selInfo) : -1;

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
      <div style={{ display: "flex", gap: "0.6rem", marginBottom: "0.7rem" }}>
        <button style={tabBtn(mode === "xian")} onClick={() => setMode("xian")}>
          {zT("先天八卦")}
        </button>
        <button style={tabBtn(mode === "hou")} onClick={() => setMode("hou")}>
          {zT("後天八卦")}
        </button>
      </div>
      <p className="muted" style={{ fontSize: "0.82rem", textAlign: "center", margin: "0 0 0.8rem" }}>
        {zT("方位:上南下北,左東右西。同一家人,兩種座位——切換看看每卦搬到哪裡。")}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "8px",
          maxWidth: "340px",
          margin: "0 auto",
        }}
      >
        {seats.map((name, i) => {
          if (name === null) {
            return (
              <div
                key={i}
                style={{
                  aspectRatio: "1",
                  borderRadius: "12px",
                  border: "1.5px dashed var(--line)",
                  background: "var(--card)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "2px",
                }}
              >
                <span style={{ fontSize: "1.35rem" }}>☯</span>
                <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>{zT("中宮")}</span>
                <span style={{ fontSize: "0.68rem", color: "var(--muted)" }}>
                  {mode === "hou" ? "5 · " : ""}
                  {zT("土")}
                </span>
              </div>
            );
          }
          const t = TRIGRAMS[name];
          const st = ELEMENT_STYLE[t.element];
          const active = sel === name;
          return (
            <button
              key={i}
              onClick={() => setSel(active ? null : name)}
              aria-label={`${t.name} ${t.family} ${DIRECTIONS[i]}`}
              style={{
                aspectRatio: "1",
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
              {mode === "hou" && (
                <span
                  style={{
                    position: "absolute",
                    top: "4px",
                    left: "7px",
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    opacity: 0.85,
                  }}
                >
                  {LUOSHU[i]}
                </span>
              )}
              <span style={{ fontSize: "0.66rem", opacity: 0.85 }}>{zT(DIRECTIONS[i])}</span>
              <span style={{ fontSize: "1.45rem", fontWeight: 800, lineHeight: 1.15 }}>
                {t.name} <span style={{ fontSize: "1.05rem" }}>{t.symbol}</span>
              </span>
              <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>{zT(t.family)}</span>
              <span style={{ fontSize: "0.66rem", opacity: 0.85 }}>
                {zT(t.nature)} / {zT(t.element)}
              </span>
            </button>
          );
        })}
      </div>

      {selInfo ? (
        <div style={{ marginTop: "0.95rem" }}>
          {/* 爻象:上而下繪出,惟爻序自下而上讀;獨特爻朱砂標示 */}
          <div
            style={{
              maxWidth: "150px",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              gap: "5px",
            }}
            aria-label={zT("卦爻(自下而上讀)")}
          >
            {[2, 1, 0].map((li) => (
              <YaoLine key={li} yang={selInfo.lines[li]} unique={li === selUnique} />
            ))}
          </div>
          <p style={{ textAlign: "center", fontSize: "0.8rem", margin: "0.5rem 0 0" }}>
            {selUnique >= 0
              ? zT(
                  `朱砂色為獨特的一爻,在${["初爻(最下)", "中爻", "上爻(最上)"][selUnique]}——${selInfo.suo}得${selInfo.lines[selUnique] ? "男" : "女"},故為${selInfo.family}。`
                )
              : zT(`三爻純${selInfo.lines[0] ? "陽" : "陰"},故為${selInfo.family}。`)}
          </p>
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
              [zT("卦名"), `${selInfo.name} ${selInfo.symbol}`],
              [zT("家族"), zT(selInfo.family)],
              [zT("自然象 / 五行"), `${zT(selInfo.nature)} / ${zT(selInfo.element)}`],
              [zT("先天方位"), zT(DIRECTIONS[XIAN_TIAN.indexOf(selInfo.name)])],
              [
                zT("後天方位 / 洛書數"),
                `${zT(DIRECTIONS[HOU_TIAN.indexOf(selInfo.name)])} / ${LUOSHU[HOU_TIAN.indexOf(selInfo.name)]}`,
              ],
              [zT("先天對卦"), zT(selInfo.opposite)],
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
                <dd style={{ margin: 0, fontSize: "1.02rem", fontWeight: 700 }}>{v}</dd>
              </div>
            ))}
          </dl>
          <p className="muted" style={{ fontSize: "0.8rem", marginTop: "0.7rem", marginBottom: 0 }}>
            {mode === "xian"
              ? zT("現看先天圖:此卦正坐在先天方位;切換「後天八卦」,看它搬到哪一宮。")
              : zT("現看後天圖:格內左上角數字為洛書數;切換「先天八卦」,看它回到哪個方位。")}
          </p>
        </div>
      ) : (
        <p className="muted" style={{ fontSize: "0.85rem", textAlign: "center", marginTop: "0.9rem", marginBottom: 0 }}>
          {zT("點選任一卦,查看它的爻象、家族排行與兩個方位。")}
        </p>
      )}
    </div>
  );
}
