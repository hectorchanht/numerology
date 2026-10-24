"use client";

import { useMemo, useState } from "react";
import { useScript } from "@/lib/i18n";

/**
 * 手機號八星配對表(民間數字八星體系;延年、絕命兩組經道之光《天眼風水師》
 * 第358章核對:延年 19/91、78/87、34/43、26/62;絕命 12/21、69/96、48/84、37/73)。
 * 含 0 或 5 的數對,各家說法不一(或作變數、或作加強),本工具只標示不下斷語。
 * 號碼只在使用者裝置上計算,不上傳、不儲存。
 */
const STAR_OF_PAIR: Record<string, { star: string; kind: "ji" | "xiong" | "fu" }> = (() => {
  const table: Record<string, [string, "ji" | "xiong" | "fu"]> = {
    生氣: ["生氣", "ji"],
    天醫: ["天醫", "ji"],
    延年: ["延年", "ji"],
    伏位: ["伏位", "fu"],
    絕命: ["絕命", "xiong"],
    五鬼: ["五鬼", "xiong"],
    六煞: ["六煞", "xiong"],
    禍害: ["禍害", "xiong"],
  };
  const pairs: Record<string, string[]> = {
    生氣: ["14", "41", "67", "76", "39", "93", "28", "82"],
    天醫: ["13", "31", "68", "86", "49", "94", "27", "72"],
    延年: ["19", "91", "78", "87", "34", "43", "26", "62"],
    伏位: ["11", "22", "33", "44", "66", "77", "88", "99"],
    絕命: ["12", "21", "69", "96", "48", "84", "37", "73"],
    五鬼: ["18", "81", "79", "97", "36", "63", "24", "42"],
    六煞: ["16", "61", "47", "74", "38", "83", "29", "92"],
    禍害: ["17", "71", "89", "98", "46", "64", "23", "32"],
  };
  const out: Record<string, { star: string; kind: "ji" | "xiong" | "fu" }> = {};
  for (const [star, ps] of Object.entries(pairs)) {
    for (const p of ps) out[p] = { star, kind: table[star][1] };
  }
  return out;
})();

const KIND_STYLE = {
  ji: { bg: "#2e933c", fg: "#ffffff" },
  xiong: { bg: "#c92a2a", fg: "#ffffff" },
  fu: { bg: "#868e96", fg: "#ffffff" },
  bian: { bg: "#e9ecef", fg: "#495057" },
} as const;

/** 互動工具:輸入手機號,逐對標示八星(尾號最強),全程本機計算 */
export function ShoujiBaxing() {
  const { zT } = useScript();
  const [num, setNum] = useState("");

  const digits = num.replace(/\D/g, "");
  const pairs = useMemo(() => {
    const out: { pair: string; star: string; kind: keyof typeof KIND_STYLE }[] = [];
    for (let i = 0; i + 1 < digits.length; i++) {
      const pair = digits.slice(i, i + 2);
      if (pair.includes("0") || pair.includes("5")) {
        out.push({ pair, star: "變數", kind: "bian" });
      } else {
        const hit = STAR_OF_PAIR[pair];
        out.push(hit ? { pair, star: hit.star, kind: hit.kind } : { pair, star: "—", kind: "bian" });
      }
    }
    return out;
  }, [digits]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const p of pairs) c[p.star] = (c[p.star] ?? 0) + 1;
    return c;
  }, [pairs]);

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
      <p style={{ textAlign: "center", fontWeight: 800, margin: "0 0 0.35rem" }}>{zT("手機號八星分析器")}</p>
      <p className="muted" style={{ fontSize: "0.82rem", textAlign: "center", margin: "0 0 0.7rem" }}>
        {zT("輸入號碼,逐對數字標出八星;書中說法以尾號一對最強。號碼只在本機計算,不會上傳。")}
      </p>
      <input
        type="tel"
        inputMode="numeric"
        value={num}
        onChange={(e) => setNum(e.target.value)}
        placeholder={zT("輸入手機號碼")}
        aria-label={zT("手機號碼")}
        style={{
          width: "100%",
          maxWidth: "340px",
          display: "block",
          margin: "0 auto",
          padding: "0.55rem 0.7rem",
          borderRadius: "10px",
          border: "1.5px solid var(--line)",
          background: "var(--card)",
          color: "var(--ink)",
          fontSize: "1.05rem",
          letterSpacing: "0.12em",
          textAlign: "center",
        }}
      />
      {pairs.length > 0 && (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center", marginTop: "0.8rem" }}>
            {pairs.map((p, i) => {
              const st = KIND_STYLE[p.kind];
              const isTail = i === pairs.length - 1;
              return (
                <span
                  key={i}
                  style={{
                    background: st.bg,
                    color: st.fg,
                    borderRadius: "999px",
                    padding: "0.28rem 0.6rem",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    outline: isTail ? "2.5px solid var(--cinnabar)" : "none",
                    outlineOffset: "1px",
                  }}
                >
                  {p.pair} · {zT(p.star)}
                  {isTail ? ` ${zT("(尾號)")}` : ""}
                </span>
              );
            })}
          </div>
          <p className="muted" style={{ fontSize: "0.85rem", textAlign: "center", margin: "0.7rem 0 0" }}>
            {Object.entries(counts)
              .map(([star, n]) => `${zT(star)} × ${n}`)
              .join(" · ")}
          </p>
        </>
      )}
      <p className="muted" style={{ fontSize: "0.8rem", textAlign: "center", marginTop: "0.7rem", marginBottom: 0 }}>
        {zT("含 0 或 5 的數對各家說法不一,只標作變數。書中亦提醒:號碼是輔助,先修心,勿急於換號。")}
      </p>
    </div>
  );
}
