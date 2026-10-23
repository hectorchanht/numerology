"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { BirthInput } from "@numerology/engine";
import { streamPost } from "@/lib/streamClient";
import { aiRequestParts } from "@/lib/aiSettings";
import { useLocale } from "@/lib/i18n";
import { Icon } from "@/components/Icon";
import { markdownTermComponents } from "@/lib/highlightTerms";

interface Turn { role: "user" | "assistant"; content: string }

const SUGGESTION_KEYS = ["chat.sug1", "chat.sug2", "chat.sug3", "chat.sug4"] as const;

/** 命盤對話:就同一命盤追問,建議問題橫向捲動。 */
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
    <div className="chat">
      <h1 className="large">{t("chat.title")}</h1>
      <p className="lede">{t("chat.sub")}</p>

      {log.length === 0 ? (
        <div className="strip">
          {SUGGESTION_KEYS.map((k) => (
            <button key={k} type="button" className="chip" onClick={() => ask(t(k))} disabled={busy}>{t(k)}</button>
          ))}
        </div>
      ) : (
        <div className="chat-log">
          {log.map((t2, i) => (
            <div key={i} className={`bubble ${t2.role}`}>
              {t2.role === "assistant" ? (
                <div className={`prose ${busy && i === log.length - 1 ? "is-streaming" : ""}`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownTermComponents}>
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

      {error ? <p className="notice" role="alert">{error}</p> : null}

      <form
        className="chat-input"
        onSubmit={(e) => { e.preventDefault(); ask(draft); }}
      >
        <input
          value={draft}
          placeholder={t("chat.placeholder")}
          aria-label={t("chat.placeholder")}
          onChange={(e) => setDraft(e.target.value)}
          disabled={busy}
        />
        <button className="icon-btn solid" type="submit" disabled={busy || !draft.trim()} aria-label={t("chat.ask")}>
          <Icon name="send" />
        </button>
      </form>
    </div>
  );
}
