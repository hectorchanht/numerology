"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { BirthInput } from "@numerology/engine";
import { streamPost } from "@/lib/streamClient";
import { aiRequestParts } from "@/lib/aiSettings";
import { useLocale } from "@/lib/i18n";

interface Turn { role: "user" | "assistant"; content: string }

const SUGGESTION_KEYS = ["chat.sug1", "chat.sug2", "chat.sug3", "chat.sug4"] as const;

export function ChatPanel({ input }: { input: BirthInput }) {
  const { t, locale } = useLocale();
  const [log, setLog] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    setError("");
    setDraft("");
    const history = log;
    setLog((l) => [...l, { role: "user", content: q }, { role: "assistant", content: "" }]);
    setBusy(true);
    try {
      const { ai, systemPrompt } = aiRequestParts();
      await streamPost("/api/chat", { input, history, question: q, ai, locale, ...(systemPrompt ? { systemPrompt } : {}) }, (full) => {
        setLog((l) => {
          const next = [...l];
          next[next.length - 1] = { role: "assistant", content: full };
          return next;
        });
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : t("chat.fail"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h2 className="section-title">{t("chat.title")}</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        {t("chat.sub")}
      </p>

      {log.length === 0 ? (
        <div className="suggest">
          {SUGGESTION_KEYS.map((k) => (
            <button key={k} className="chip" onClick={() => ask(t(k))} disabled={busy}>{t(k)}</button>
          ))}
        </div>
      ) : (
        <div className="chat-log">
          {log.map((t2, i) => (
            <div key={i} className={`bubble ${t2.role}`}>
              {t2.role === "assistant" ? (
                <div className={`prose ${busy && i === log.length - 1 ? "cursor" : ""}`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {t2.content || t("chat.thinking")}
                  </ReactMarkdown>
                </div>
              ) : (
                t2.content
              )}
            </div>
          ))}
        </div>
      )}

      {error ? <p className="notice">{error}</p> : null}

      <form
        className="chat-input"
        onSubmit={(e) => { e.preventDefault(); ask(draft); }}
      >
        <input
          value={draft}
          placeholder={t("chat.placeholder")}
          onChange={(e) => setDraft(e.target.value)}
          disabled={busy}
        />
        <button className="btn" type="submit" disabled={busy || !draft.trim()}>
          {busy ? "…" : t("chat.ask")}
        </button>
      </form>
    </div>
  );
}
