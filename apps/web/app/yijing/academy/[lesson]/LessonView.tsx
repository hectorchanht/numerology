"use client";

import Link from "next/link";
import { useState } from "react";
import { ACADEMY_LESSONS, getLesson } from "../lessons";
import { Quiz } from "../Quiz";
import { useLocale } from "@/lib/i18n";
import { yjT, type YijingLocale } from "@/lib/yijingStrings";
import { withTermHighlights } from "@/lib/highlightTerms";

/** 單課頁(客戶端):正文 + 自我檢測。 */
export function LessonView({ lessonId }: { lessonId: string }) {
  const { locale } = useLocale();
  const loc = locale as YijingLocale;
  const lesson = getLesson(lessonId);
  const [refresh, setRefresh] = useState(0);

  if (!lesson) {
    return (
      <div className="card">
        <p>{yjT("academy.notFound", loc)}</p>
        <Link href="/yijing/academy">{yjT("academy.back", loc)}</Link>
      </div>
    );
  }

  const idx = ACADEMY_LESSONS.findIndex((l) => l.id === lesson.id);
  const prev = ACADEMY_LESSONS[idx - 1];
  const next = ACADEMY_LESSONS[idx + 1];

  return (
    <>
      <div className="masthead" style={{ paddingTop: "1.2rem" }}>
        <div className="sub">
          {yjT("academy.lessonNo", loc).replace("{n}", String(lesson.index))}
        </div>
        <h1 style={{ letterSpacing: "0.2em" }}>{lesson.title}</h1>
        <div className="sub">{lesson.sub}</div>
      </div>

      <div className="card" key={refresh}>
        {lesson.sections.map((s, si) => (
          <section key={si} style={{ marginBottom: si < lesson.sections.length - 1 ? "1.4rem" : 0 }}>
            <h2 className="section-title">{s.heading}</h2>
            {s.body.map((p, pi) => (
              <p key={pi} style={{ lineHeight: 1.9, marginBottom: "0.8rem" }}>
                {withTermHighlights(p)}
              </p>
            ))}
          </section>
        ))}
      </div>

      <Quiz lesson={lesson} onDone={() => setRefresh((r) => r + 1)} />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "0.8rem",
          marginTop: "1.2rem",
          flexWrap: "wrap",
        }}
      >
        {prev ? (
          <Link className="btn ghost" href={`/yijing/academy/${prev.id}`}>
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link className="btn" href={`/yijing/academy/${next.id}`}>
            {next.title} →
          </Link>
        ) : (
          <Link className="btn" href="/yijing">
            {yjT("academy.goDivine", loc)} →
          </Link>
        )}
      </div>
      <div style={{ marginTop: "0.8rem" }}>
        <Link href="/yijing/academy" className="muted">
          {yjT("academy.back", loc)}
        </Link>
      </div>
    </>
  );
}
