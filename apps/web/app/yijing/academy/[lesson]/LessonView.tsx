"use client";

import Link from "next/link";
import { GroupTabs } from "@/components/GroupTabs";
import { STUDY_TABS } from "@/lib/navGroups";
import { Fragment, useCallback, useEffect, useState } from "react";
import { ACADEMY_LESSONS, ACADEMY_QUOTE_REFS, getLesson, getTrack } from "../lessons";
import { Quiz } from "../Quiz";
import { PalmDiagram } from "../PalmDiagram";
import { BaguaFamilyGrid } from "../BaguaFamilyGrid";
import { JiugongMnemonic } from "../JiugongMnemonic";
import { BaxingPan } from "../BaxingPan";
import { ShoujiBaxing } from "../ShoujiBaxing";
import { AbcdeSteps } from "../AbcdeSteps";
import { LessonNotepad } from "../LessonNotepad";
import { buildNoteTemplate, hasNote } from "../notes";
import { Icon } from "@/components/Icon";
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
  const [notesOpen, setNotesOpen] = useState(false);
  const [noteExists, setNoteExists] = useState(false);
  const closeNotes = useCallback(() => setNotesOpen(false), []);
  /* 筆記掣紅點:入頁 + 關面板嗰陣重查一次有冇筆記 */
  useEffect(() => {
    if (!notesOpen) setNoteExists(hasNote(lessonId));
  }, [lessonId, notesOpen]);

  /* 筆記開著(闊面板佔位)→ 左側欄收起淨圖示(body class,CSS ≥1024 先有效);閂/離頁還原 */
  useEffect(() => {
    document.body.classList.toggle("wide-panel-open", notesOpen);
    return () => document.body.classList.remove("wide-panel-open");
  }, [notesOpen]);

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

  /* 學習模板:課文標題/節題/測驗題先本地化,再交純函數砌版 */
  const noteTemplate = buildNoteTemplate(
    {
      title: zT(lesson.title),
      sections: lesson.sections.map((s) => ({ heading: zT(s.heading) })),
      quiz: lesson.quiz.map((q) => ({ q: zT(q.q) })),
    },
    {
      annotate: yjT("academy.notesTplAnnotate", loc),
      quiz: yjT("academy.notesTplQuiz", loc),
      answer: yjT("academy.notesTplAnswer", loc),
      summary: yjT("academy.notesTplSummary", loc),
      unclear: yjT("academy.notesTplUnclear", loc),
    },
  );

  const widgetAt = (si: number) => (
    <>
      {lesson.widget === "palm" && lesson.widgetAfter === si && <PalmDiagram />}
      {lesson.widget === "bagua" && lesson.widgetAfter === si && <BaguaFamilyGrid />}
      {lesson.widget === "jiugong" && lesson.widgetAfter === si && <JiugongMnemonic />}
      {lesson.widget === "baxing" && lesson.widgetAfter === si && <BaxingPan />}
      {lesson.widget === "shouji" && lesson.widgetAfter === si && <ShoujiBaxing />}
      {lesson.widget === "abcde" && lesson.widgetAfter === si && <AbcdeSteps />}
    </>
  );

  return (
    <>
      <GroupTabs links={STUDY_TABS} label={yjT("nav.group.study", loc)} />

      <div className="masthead" style={{ paddingTop: "1.2rem" }}>
        <div className="sub">
          {zT(`${getTrack(lesson.track).no} · ${getTrack(lesson.track).title}`)} ·{" "}
          {yjT("academy.lessonNo", loc).replace("{n}", String(lesson.index))}
        </div>
        <h1 style={{ letterSpacing: "0.2em" }}>{zT(lesson.title)}</h1>
        <div className="sub">{zT(lesson.sub)}</div>
        <div style={{ marginTop: "0.8rem" }}>
          <button type="button" className="btn ghost small" onClick={() => setNotesOpen(true)}>
            <Icon name="edit" small /> {yjT("academy.notes", loc)}
            {noteExists && (
              <span
                aria-hidden
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "var(--cinnabar)",
                  flex: "0 0 auto",
                }}
              />
            )}
          </button>
        </div>
      </div>

      <div className={notesOpen ? "lesson-cols has-notes" : "lesson-cols"}>
      <div className="lesson-main">
      <div className="card" key={refresh}>
        {/* widgetAfter: -1 = 圖先行,組件放在第一節之前,先看圖再讀字 */}
        {lesson.widgetAfter === -1 && <div style={{ marginBottom: "1.2rem" }}>{widgetAt(-1)}</div>}
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
            {widgetAt(si)}
          </Fragment>
        ))}
      </div>

      {lesson.worksheet && (
        <div className="card" style={{ marginTop: "1.2rem" }}>
          <h2 className="section-title">{yjT("academy.worksheet", loc)}</h2>
          <p className="muted" style={{ fontSize: "13px", marginBottom: "0.8rem" }}>
            {yjT("academy.worksheetNote", loc)}
          </p>
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <a className="btn ghost" href={lesson.worksheet.pdf} download>
              <Icon name="download" small /> {yjT("academy.worksheetPdf", loc)}
            </a>
            <a className="btn ghost" href={lesson.worksheet.txt} download>
              <Icon name="download" small /> {yjT("academy.worksheetTxt", loc)}
            </a>
          </div>
        </div>
      )}

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
      </div>
      <LessonNotepad
        lessonId={lesson.id}
        title={zT(lesson.title)}
        template={noteTemplate}
        open={notesOpen}
        onClose={closeNotes}
      />
      </div>
    </>
  );
}
