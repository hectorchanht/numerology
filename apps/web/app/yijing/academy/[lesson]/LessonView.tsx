"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import { ACADEMY_LESSONS, ACADEMY_QUOTE_REFS, getLesson, getTrack } from "../lessons";
import { Quiz } from "../Quiz";
import { PalmDiagram } from "../PalmDiagram";
import { BaguaFamilyGrid } from "../BaguaFamilyGrid";
import { JiugongMnemonic } from "../JiugongMnemonic";
import { BaxingPan } from "../BaxingPan";
import { ShoujiBaxing } from "../ShoujiBaxing";
import { AbcdeSteps } from "../AbcdeSteps";
import { useLocale, useScript } from "@/lib/i18n";
import { yjT, type YijingLocale } from "@/lib/yijingStrings";
import { withTermHighlights } from "@/lib/highlightTerms";
import { withQuoteRefs } from "@/lib/quoteRef";

/** 單課頁(客戶端):正文 + 自我檢測。 */
export function LessonView({ lessonId }: { lessonId: string }) {
  const { locale } = useLocale();
  // 課文係繁體正本 → zT(只喺 zhs 轉;en 暫無英文課文,維持繁體)
  const { zT } = useScript();
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
          {zT(`${getTrack(lesson.track).no} · ${getTrack(lesson.track).title}`)} ·{" "}
          {yjT("academy.lessonNo", loc).replace("{n}", String(lesson.index))}
        </div>
        <h1 style={{ letterSpacing: "0.2em" }}>{zT(lesson.title)}</h1>
        <div className="sub">{zT(lesson.sub)}</div>
      </div>

      <div className="card" key={refresh}>
        {lesson.sections.map((s, si) => (
          <Fragment key={si}>
            <section style={{ marginBottom: si < lesson.sections.length - 1 ? "1.4rem" : 0 }}>
              <h2 className="section-title">{zT(s.heading)}</h2>
              {s.body.map((p, pi) => (
                <p key={pi} style={{ lineHeight: 1.9, marginBottom: "0.8rem" }}>
                  {withTermHighlights(withQuoteRefs(p, ACADEMY_QUOTE_REFS), zT)}
                </p>
              ))}
            </section>
            {lesson.widget === "palm" && lesson.widgetAfter === si && <PalmDiagram />}
            {lesson.widget === "bagua" && lesson.widgetAfter === si && <BaguaFamilyGrid />}
            {lesson.widget === "jiugong" && lesson.widgetAfter === si && <JiugongMnemonic />}
            {lesson.widget === "baxing" && lesson.widgetAfter === si && <BaxingPan />}
            {lesson.widget === "shouji" && lesson.widgetAfter === si && <ShoujiBaxing />}
            {lesson.widget === "abcde" && lesson.widgetAfter === si && <AbcdeSteps />}
          </Fragment>
        ))}
      </div>

      <Quiz lesson={lesson} onDone={() => setRefresh((r) => r + 1)} />

      {lesson.sources && lesson.sources.length > 0 && (
        <div className="card" style={{ marginTop: "1.2rem" }}>
          <h2 className="section-title">{yjT("academy.sources", loc)}</h2>
          <p className="muted" style={{ fontSize: "0.85rem", marginBottom: "0.6rem" }}>
            {yjT("academy.sourcesNote", loc)}
          </p>
          <ul style={{ paddingLeft: "1.2rem", margin: 0 }}>
            {lesson.sources.map((s, i) => (
              <li key={i} style={{ marginBottom: "0.4rem" }}>
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {zT(s.label)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

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
            ← {zT(prev.title)}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link className="btn" href={`/yijing/academy/${next.id}`}>
            {zT(next.title)} →
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
