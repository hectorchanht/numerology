"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { HourCandidate } from "@numerology/engine";
import type { BirthFormValue, Calendar } from "@/lib/formTypes";
import { streamPost } from "@/lib/streamClient";
import { aiRequestParts } from "@/lib/aiSettings";
import { useLocale, useScript } from "@/lib/i18n";
import { yjT } from "@/lib/yijingStrings";
import { LocationPicker } from "@/components/LocationPicker";
import { AiModelNote } from "@/components/AiModelNote";
import { Icon } from "@/components/Icon";
import { Seg, ToggleRow } from "@/components/ui";

interface Turn { role: "user" | "assistant"; content: string }

const DATE_FIELDS = [
  { key: "year", labelKey: "form.year" as const, min: 1900, max: 2100 },
  { key: "month", labelKey: "form.month" as const, min: 1, max: 12 },
  { key: "day", labelKey: "form.day" as const, min: 1, max: 31 },
] as const;

export function TimeInferPanel({ onAdopt }: { onAdopt: (input: BirthFormValue) => void }) {
  const { t, locale } = useLocale();
  const { z } = useScript();
  const [v, setV] = useState<Record<string, string>>({ year: "", month: "", day: "" });
  const [gender, setGender] = useState<"男" | "女">("男");
  const [calendar, setCalendar] = useState<Calendar>("solar");
  const [isLeapMonth, setIsLeapMonth] = useState(false);
  const [longitude, setLongitude] = useState<string>("");
  const [trueSolar, setTrueSolar] = useState(true);
  const [started, setStarted] = useState(false);
  const [candidates, setCandidates] = useState<HourCandidate[]>([]);
  const [log, setLog] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // 真太陽時關閉 → 唔帶經度(與 BirthForm 一致)。
  const lon = trueSolar && longitude !== "" ? { longitude: Number(longitude) } : {};

  const inferInput = () => ({
    year: Number(v.year), month: Number(v.month), day: Number(v.day), gender,
    calendar,
    ...(calendar === "lunar" && isLeapMonth ? { isLeapMonth: true } : {}),
    ...lon,
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
    const { ai, systemPrompt } = aiRequestParts();
    await streamPost(
      "/api/infer-time",
      { input: inferInput(), history, message, ai, locale, ...(systemPrompt ? { systemPrompt } : {}) },
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
      ...lon,
    });
  };

  if (!started) {
    return (
      <div>
        <p className="note lead-note">
          {t("infer.descA")}<strong>{t("infer.descB")}</strong>{t("infer.descC")}
        </p>
        <h2 className="group-title">{t("infer.groupKnown")}</h2>
        <div className="list">
          <div className="row">
            <Icon name="cal" className="ic" />
            <span className="lbl">{t("form.calendar")}</span>
            <Seg
              compact
              label={t("form.calendar")}
              value={calendar}
              onChange={setCalendar}
              options={[
                { value: "solar", label: t("form.solarShort") },
                { value: "lunar", label: t("form.lunarShort") },
              ]}
            />
          </div>
          {calendar === "lunar" ? (
            <ToggleRow icon="cal" label={t("form.leap")} checked={isLeapMonth} onChange={setIsLeapMonth} />
          ) : null}
          {DATE_FIELDS.map((f) => (
            <label className="row" key={f.key} htmlFor={`ti-${f.key}`}>
              <Icon name="cal" className="ic" />
              <span className="lbl">{f.key === "year" ? (calendar === "lunar" ? t("form.yearLunar") : t("form.yearSolar")) : t(f.labelKey)}</span>
              <input id={`ti-${f.key}`} type="number" inputMode="numeric" min={f.min} max={f.max}
                value={v[f.key]} onChange={(e) => setV((s) => ({ ...s, [f.key]: e.target.value }))} />
            </label>
          ))}
          <div className="row">
            <Icon name="user" className="ic" />
            <span className="lbl">{t("form.gender")}</span>
            <Seg
              compact
              label={t("form.gender")}
              value={gender}
              onChange={setGender}
              options={[
                { value: "男", label: t("form.male") },
                { value: "女", label: t("form.female") },
              ]}
            />
          </div>
          <LocationPicker value={longitude} onChange={setLongitude} />
          <ToggleRow
            icon="sun"
            label={t("form.trueSolar")}
            sub={!trueSolar ? t("form.trueSolarOff") : longitude === "" ? t("form.trueSolarNeedCity") : t("form.trueSolarOn")}
            checked={trueSolar}
            onChange={setTrueSolar}
          />
        </div>
        {error ? <p className="notice" role="alert">{error}</p> : null}
        <button type="button" className="btn block cta" onClick={start} disabled={busy}>
          <Icon name="spark" />
          {busy ? t("infer.preparing") : t("infer.start")}
        </button>
        <AiModelNote />
      </div>
    );
  }

  return (
    <div>
      <h2 className="group-title">{t("infer.chatTitle")}</h2>
      <div className="chat-log">
        {log.map((t2, i) => (
          <div key={i} className={`bubble ${t2.role}`}>
            {t2.role === "assistant" ? (
              <div className={`prose ${busy && i === log.length - 1 ? "is-streaming" : ""}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{t2.content || t("chat.thinking")}</ReactMarkdown>
              </div>
            ) : t2.content}
          </div>
        ))}
      </div>
      {error ? <p className="notice" role="alert">{error}</p> : null}
      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); answer(); }}>
        <input value={draft} placeholder={t("infer.answerPh")} onChange={(e) => setDraft(e.target.value)} disabled={busy} aria-label={t("infer.answerPh")} />
        <button className="icon-btn solid" type="submit" disabled={busy || !draft.trim()} aria-label={t("infer.answerBtn")}>
          <Icon name="send" />
        </button>
      </form>

      <h2 className="group-title">{t("infer.adoptHint")}</h2>
      <div className="strip">
        {candidates.map((c) => (
          <button key={c.shichen} type="button" className="shichen-btn" onClick={() => adopt(c.hour)} disabled={busy}>
            <span className="sc-name">{z(c.shichen)}</span>
            <span className="sc-range">{c.range}</span>
            <span className="sc-soul">{yjT("poster.soulPalace", locale)} {c.soulBranch}·{z(c.soulMajorStars.join("")) || t("infer.emptyPalace")}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
