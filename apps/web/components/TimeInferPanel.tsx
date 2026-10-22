"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { HourCandidate } from "@numerology/engine";
import type { BirthFormValue, Calendar } from "@/lib/formTypes";
import { streamPost } from "@/lib/streamClient";
import { loadAi } from "@/lib/aiSettings";
import { useLocale } from "@/lib/i18n";
import { LocationPicker } from "@/components/LocationPicker";

interface Turn { role: "user" | "assistant"; content: string }

const DATE_FIELDS = [
  { key: "year", labelKey: "form.year" as const, min: 1900, max: 2100 },
  { key: "month", labelKey: "form.month" as const, min: 1, max: 12 },
  { key: "day", labelKey: "form.day" as const, min: 1, max: 31 },
] as const;

export function TimeInferPanel({ onAdopt }: { onAdopt: (input: BirthFormValue) => void }) {
  const { t, locale } = useLocale();
  const [v, setV] = useState<Record<string, string>>({ year: "", month: "", day: "" });
  const [gender, setGender] = useState<"男" | "女">("男");
  const [calendar, setCalendar] = useState<Calendar>("solar");
  const [isLeapMonth, setIsLeapMonth] = useState(false);
  const [longitude, setLongitude] = useState<string>("");
  const [started, setStarted] = useState(false);
  const [candidates, setCandidates] = useState<HourCandidate[]>([]);
  const [log, setLog] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const inferInput = () => ({
    year: Number(v.year), month: Number(v.month), day: Number(v.day), gender,
    calendar,
    ...(calendar === "lunar" && isLeapMonth ? { isLeapMonth: true } : {}),
    ...(longitude !== "" ? { longitude: Number(longitude) } : {}),
  });

  const validDate = (): boolean =>
    DATE_FIELDS.every((f) => {
      const n = Number(v[f.key]);
      return v[f.key] !== "" && Number.isInteger(n) && n >= f.min && n <= f.max;
    });

  const start = async () => {
    if (!validDate()) { setError(t("infer.badDate")); return; }
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/hour-candidates", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inferInput()),
      });
      const data = (await res.json()) as { candidates?: HourCandidate[]; error?: string };
      if (!res.ok || !data.candidates) throw new Error(data.error ?? t("infer.candidatesFail"));
      setCandidates(data.candidates);
      setStarted(true);
      await send("", []); // 开场:让 AI 自我介绍并发起首轮提问
    } catch (e) {
      setError(e instanceof Error ? e.message : t("infer.startFail"));
    } finally {
      setBusy(false);
    }
  };

  // history = 本轮之前的完整对话;message = 本轮用户输入(空=开场)。
  const send = async (message: string, history: Turn[]) => {
    const display: Turn[] = message ? [...history, { role: "user", content: message }] : [...history];
    setLog([...display, { role: "assistant", content: "" }]);
    await streamPost(
      "/api/infer-time",
      { input: inferInput(), history, message, ai: loadAi(), locale },
      (full) => setLog((l) => {
        const next = [...l];
        next[next.length - 1] = { role: "assistant", content: full };
        return next;
      }),
    );
  };

  const answer = async () => {
    const q = draft.trim();
    if (!q || busy) return;
    setDraft("");
    setBusy(true);
    setError("");
    try {
      await send(q, log);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("infer.chatFail"));
    } finally {
      setBusy(false);
    }
  };

  const adopt = (hour: number) => {
    onAdopt({
      year: Number(v.year), month: Number(v.month), day: Number(v.day),
      hour, minute: 0, gender, calendar,
      ...(calendar === "lunar" && isLeapMonth ? { isLeapMonth: true } : {}),
      ...(longitude !== "" ? { longitude: Number(longitude) } : {}),
    });
  };

  if (!started) {
    return (
      <div className="card">
        <h2 className="section-title">{t("infer.title")}</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          {t("infer.descA")}<strong>{t("infer.descB")}</strong>{t("infer.descC")}
        </p>
        <div className="cal-toggle">
          <button type="button" className={calendar === "solar" ? "active" : ""} onClick={() => setCalendar("solar")}>{t("form.solar")}</button>
          <button type="button" className={calendar === "lunar" ? "active" : ""} onClick={() => setCalendar("lunar")}>{t("form.lunar")}</button>
          {calendar === "lunar" ? (
            <label className="leap-check">
              <input type="checkbox" checked={isLeapMonth} onChange={(e) => setIsLeapMonth(e.target.checked)} />{t("form.leap")}
            </label>
          ) : null}
        </div>
        <div className="form-grid">
          {DATE_FIELDS.map((f) => (
            <div className="field" key={f.key}>
              <label htmlFor={`ti-${f.key}`}>{f.key === "year" ? (calendar === "lunar" ? t("form.yearLunar") : t("form.yearSolar")) : t(f.labelKey)}</label>
              <input id={`ti-${f.key}`} type="number" inputMode="numeric" min={f.min} max={f.max}
                value={v[f.key]} onChange={(e) => setV((s) => ({ ...s, [f.key]: e.target.value }))} />
            </div>
          ))}
          <div className="field">
            <label htmlFor="ti-gender">{t("form.gender")}</label>
            <select id="ti-gender" value={gender} onChange={(e) => setGender(e.target.value as "男" | "女")}>
              <option value="男">{t("form.male")}</option><option value="女">{t("form.female")}</option>
            </select>
          </div>
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>{t("form.birthplace")}</label>
            <LocationPicker value={longitude} onChange={setLongitude} />
          </div>
        </div>
        <div style={{ marginTop: "1.1rem" }}>
          <button className="btn" onClick={start} disabled={busy}>{busy ? t("infer.preparing") : t("infer.start")}</button>
          {error ? <span className="notice" style={{ marginLeft: "1rem" }}>{error}</span> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="section-title">{t("infer.chatTitle")}</h2>
      <div className="chat-log">
        {log.map((t2, i) => (
          <div key={i} className={`bubble ${t2.role}`}>
            {t2.role === "assistant" ? (
              <div className={`prose ${busy && i === log.length - 1 ? "cursor" : ""}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{t2.content || t("chat.thinking")}</ReactMarkdown>
              </div>
            ) : t2.content}
          </div>
        ))}
      </div>
      {error ? <p className="notice">{error}</p> : null}
      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); answer(); }}>
        <input value={draft} placeholder={t("infer.answerPh")} onChange={(e) => setDraft(e.target.value)} disabled={busy} />
        <button className="btn" type="submit" disabled={busy || !draft.trim()}>{t("infer.answerBtn")}</button>
      </form>

      <div style={{ marginTop: "1.2rem", borderTop: "1px dashed var(--line)", paddingTop: "1rem" }}>
        <p className="muted" style={{ marginTop: 0 }}>{t("infer.adoptHint")}</p>
        <div className="shichen-grid">
          {candidates.map((c) => (
            <button key={c.shichen} className="shichen-btn" onClick={() => adopt(c.hour)} disabled={busy}>
              <span className="sc-name">{c.shichen}</span>
              <span className="sc-range">{c.range}</span>
              <span className="sc-soul">命宫{c.soulBranch}·{c.soulMajorStars.join("") || t("infer.emptyPalace")}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
