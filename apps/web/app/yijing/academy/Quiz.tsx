"use client";

import { useState } from "react";
import type { AcademyQuizQ, AcademyLesson } from "./lessons";
import { saveProgress, loadProgress } from "./lessons";
import { useLocale } from "@/lib/i18n";
import { yjT, type YijingLocale } from "@/lib/yijingStrings";

/** 自我檢測:單選 → 對答案 → 記分,完成後寫入 localStorage 進度。 */
export function Quiz({ lesson, onDone }: { lesson: AcademyLesson; onDone?: () => void }) {
  const { locale } = useLocale();
  const loc = locale as YijingLocale;
  const [picked, setPicked] = useState<(number | null)[]>(lesson.quiz.map(() => null));
  const [checked, setChecked] = useState(false);

  const total = lesson.quiz.length;
  const score = lesson.quiz.reduce(
    (a, q, i) => a + (picked[i] === q.answer ? 1 : 0),
    0,
  );

  const check = () => {
    if (picked.some((p) => p === null)) return;
    setChecked(true);
    const prev = loadProgress();
    const old = prev[lesson.id];
    const best = Math.max(old?.best ?? 0, score);
    saveProgress({ ...prev, [lesson.id]: { done: true, best, total } });
    onDone?.();
  };

  const reset = () => {
    setPicked(lesson.quiz.map(() => null));
    setChecked(false);
  };

  return (
    <div className="card" style={{ borderColor: "var(--cinnabar-soft)" }}>
      <h2 className="section-title">{yjT("academy.quiz", loc)}</h2>
      {lesson.quiz.map((q: AcademyQuizQ, qi: number) => {
        const sel = picked[qi];
        const ok = checked && sel === q.answer;
        const bad = checked && sel !== null && sel !== q.answer;
        return (
          <div key={qi} style={{ marginBottom: "1.1rem" }}>
            <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
              {qi + 1}. {q.q}{" "}
              {checked && (
                <span className={`badge ${ok ? "badge-ok" : "badge-warn"}`}>
                  {ok ? yjT("academy.quizRight", loc) : yjT("academy.quizWrong", loc)}
                </span>
              )}
            </div>
            <div style={{ display: "grid", gap: "0.4rem" }}>
              {q.options.map((opt, oi) => {
                const isPick = sel === oi;
                const isAns = q.answer === oi;
                return (
                  <button
                    key={oi}
                    disabled={checked}
                    onClick={() => setPicked((p) => p.map((v, i) => (i === qi ? oi : v)))}
                    style={{
                      textAlign: "left",
                      font: "inherit",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "8px",
                      cursor: checked ? "default" : "pointer",
                      border: `1px solid ${
                        checked && isAns
                          ? "var(--cinnabar)"
                          : isPick
                            ? "var(--line-strong)"
                            : "var(--line)"
                      }`,
                      background: checked && isAns ? "oklch(60% 0.14 32 / 0.07)" : "transparent",
                      color: "var(--ink)",
                      opacity: checked && !isAns && !isPick ? 0.55 : 1,
                    }}
                  >
                    <span className="muted" style={{ marginRight: "0.5em" }}>
                      {["A", "B", "C", "D"][oi]}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
            {bad && <p className="muted" style={{ marginTop: "0.4rem" }}>{q.explain}</p>}
            {ok && <p className="muted" style={{ marginTop: "0.4rem" }}>{q.explain}</p>}
          </div>
        );
      })}
      <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
        {!checked ? (
          <button className="btn" onClick={check} disabled={picked.some((p) => p === null)}>
            {yjT("academy.quizCheck", loc)}
          </button>
        ) : (
          <>
            <span style={{ fontWeight: 700 }}>
              {yjT("academy.quizScore", loc).replace("{s}", String(score)).replace("{t}", String(total))}
            </span>
            <button className="btn ghost" onClick={reset}>
              {yjT("academy.quizRetry", loc)}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
