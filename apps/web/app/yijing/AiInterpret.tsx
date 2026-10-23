"use client";

import { useState } from "react";
import type { CoinLine } from "@numerology/engine";
import { streamPost } from "@/lib/streamClient";
import { yjT, type YijingLocale } from "@/lib/yijingStrings";

/**
 * AI 解卦按鈕:走 /api/yijing/interpret(Workers AI,共用 $2/月預算守衛 + KV 緩存)。
 * 預算耗盡 → 後端回乾淨 429,這裡顯示原文,不崩。
 */
export function AiInterpret({
  hexagram,
  lines,
  locale,
}: {
  hexagram: number;
  lines: CoinLine[];
  locale: YijingLocale;
}) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [text, setText] = useState("");
  const [err, setErr] = useState("");

  const start = async () => {
    setState("loading");
    setText("");
    setErr("");
    try {
      await streamPost(
        "/api/yijing/interpret",
        { hexagram, lines, locale },
        (full) => setText(full),
      );
      setState("done");
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setState("error");
    }
  };

  return (
    <div style={{ marginTop: "1.2rem" }}>
      {state === "idle" && (
        <button className="btn" onClick={start}>
          {yjT("ai.interpret", locale)}
        </button>
      )}
      {state === "loading" && !text && <p className="muted">{yjT("ai.loading", locale)}</p>}
      {text && (
        <div
          className="card"
          style={{ marginTop: "0.8rem", borderColor: "var(--cinnabar-soft)" }}
        >
          <h3 style={{ fontSize: "1rem", margin: "0 0 0.6rem" }}>
            {yjT("ai.interpretTitle", locale)}
          </h3>
          <p style={{ lineHeight: 1.9, margin: 0, whiteSpace: "pre-wrap" }}>{text}</p>
          {state === "done" && (
            <button className="btn ghost" onClick={start} style={{ marginTop: "0.8rem" }}>
              {yjT("ai.retry", locale)}
            </button>
          )}
        </div>
      )}
      {state === "error" && (
        <div className="card" style={{ marginTop: "0.8rem", borderColor: "var(--cinnabar)" }}>
          <p style={{ margin: "0 0 0.6rem", color: "var(--cinnabar)" }}>{err}</p>
          <button className="btn ghost" onClick={start}>
            {yjT("ai.retry", locale)}
          </button>
        </div>
      )}
      <p className="muted" style={{ marginTop: "0.6rem", marginBottom: 0 }}>
        {yjT("ai.budgetNote", locale)}
      </p>
    </div>
  );
}
