"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  emptyNote,
  loadNote,
  saveNote,
  type LessonNote,
  type NotePoint,
  type Stroke,
} from "./notes";
import { useLocale } from "@/lib/i18n";
import { yjT, type YijingLocale } from "@/lib/yijingStrings";

/**
 * 單課筆記面板:右邊抽屜,文字 + 手寫兩 tab。
 * 內容經 notes.ts 存 localStorage(只喺此裝置),寫入 debounce 400ms。
 * 手寫用 Pointer Events 食 Apple Pencil 筆壓;座標歸一化 0–1,任何面板尺寸都還原到。
 */
export function LessonNotepad({ lessonId, title }: { lessonId: string; title: string }) {
  const { locale } = useLocale();
  const loc = locale as YijingLocale;
  const [open, setOpen] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [tab, setTab] = useState<"text" | "draw">("text");
  const [note, setNote] = useState<LessonNote>(emptyNote());
  const [exists, setExists] = useState(false);
  const [savedAt, setSavedAt] = useState(0);
  const [grid, setGrid] = useState(true);

  const noteRef = useRef(note);
  const timerRef = useRef<number | undefined>(undefined);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef<Stroke | null>(null);
  const lastPtRef = useRef<NotePoint | null>(null);

  /* 初次載入呢課嘅筆記 */
  useEffect(() => {
    const n = loadNote(lessonId);
    noteRef.current = n;
    setNote(n);
    setExists(n.text.trim() !== "" || n.strokes.length > 0);
    setSavedAt(n.updatedAt);
  }, [lessonId]);

  /* 窄屏判斷(backdrop 只喺窄屏出) */
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 760px)");
    const apply = () => setNarrow(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const flushSave = useCallback(() => {
    window.clearTimeout(timerRef.current);
    const n = { ...noteRef.current, updatedAt: Date.now() };
    saveNote(lessonId, n);
    setSavedAt(n.updatedAt);
    setExists(n.text.trim() !== "" || n.strokes.length > 0);
  }, [lessonId]);

  const update = useCallback(
    (n: LessonNote) => {
      noteRef.current = n;
      setNote(n);
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(flushSave, 400);
    },
    [flushSave],
  );

  /* 開面板時鎖住背景捲動 + Esc 關閉 */
  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      flushSave();
    };
  }, [open, flushSave]);

  /* ---------- 畫布 ---------- */

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    if (w === 0 || h === 0) return;
    const ink = getComputedStyle(document.body).color || "#333";
    ctx.clearRect(0, 0, w, h);
    if (grid) {
      ctx.save();
      ctx.strokeStyle = ink;
      ctx.globalAlpha = 0.16;
      ctx.lineWidth = Math.max(1, w * 0.002);
      ctx.beginPath();
      for (const f of [1 / 3, 2 / 3]) {
        ctx.moveTo(w * f, 0);
        ctx.lineTo(w * f, h);
        ctx.moveTo(0, h * f);
        ctx.lineTo(w, h * f);
      }
      ctx.stroke();
      ctx.restore();
    }
    ctx.strokeStyle = ink;
    ctx.fillStyle = ink;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const stroke of noteRef.current.strokes) {
      if (stroke.length === 1) {
        const pt = stroke[0];
        ctx.beginPath();
        ctx.arc(pt.x * w, pt.y * h, Math.max(1.2, w * 0.004 * (0.4 + pt.p)), 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      for (let i = 1; i < stroke.length; i++) {
        const a = stroke[i - 1];
        const b = stroke[i];
        ctx.lineWidth = Math.max(1, w * 0.009 * (0.35 + 0.65 * b.p));
        ctx.beginPath();
        ctx.moveTo(a.x * w, a.y * h);
        ctx.lineTo(b.x * w, b.y * h);
        ctx.stroke();
      }
    }
  }, [grid]);

  /* 畫布掛載/轉 tab/改格線/改尺寸 → 定尺寸 + 重畫 */
  useEffect(() => {
    if (!open || tab !== "draw") return;
    const fit = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      if (cw === 0 || ch === 0) return;
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      redraw();
    };
    const raf = requestAnimationFrame(fit);
    window.addEventListener("resize", fit);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", fit);
    };
  }, [open, tab, redraw]);

  useEffect(() => {
    if (open && tab === "draw") redraw();
  }, [note.strokes, open, tab, redraw]);

  const eventPoint = (e: React.PointerEvent<HTMLCanvasElement>): NotePoint => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
      p: e.pressure > 0 ? e.pressure : 0.5,
    };
  };

  const drawSegment = (a: NotePoint, b: NotePoint) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const ink = getComputedStyle(document.body).color || "#333";
    ctx.strokeStyle = ink;
    ctx.fillStyle = ink;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(1, canvas.width * 0.009 * (0.35 + 0.65 * b.p));
    ctx.beginPath();
    ctx.moveTo(a.x * canvas.width, a.y * canvas.height);
    ctx.lineTo(b.x * canvas.width, b.y * canvas.height);
    ctx.stroke();
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = eventPoint(e);
    drawingRef.current = [pt];
    lastPtRef.current = pt;
    drawSegment(pt, pt);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const stroke = drawingRef.current;
    const last = lastPtRef.current;
    if (!stroke || !last) return;
    const pt = eventPoint(e);
    if (Math.abs(pt.x - last.x) < 0.0015 && Math.abs(pt.y - last.y) < 0.0015) return;
    stroke.push(pt);
    drawSegment(last, pt);
    lastPtRef.current = pt;
  };

  const onPointerUp = () => {
    const stroke = drawingRef.current;
    drawingRef.current = null;
    lastPtRef.current = null;
    if (!stroke || stroke.length === 0) return;
    update({ ...noteRef.current, strokes: [...noteRef.current.strokes, stroke] });
  };

  /* ---------- 動作 ---------- */

  const clearText = () => {
    if (!window.confirm(yjT("academy.notesConfirmClear", loc))) return;
    update({ ...noteRef.current, text: "" });
  };

  const clearDraw = () => {
    if (!window.confirm(yjT("academy.notesConfirmClear", loc))) return;
    update({ ...noteRef.current, strokes: [] });
  };

  const undoStroke = () => {
    const strokes = noteRef.current.strokes;
    if (strokes.length === 0) return;
    update({ ...noteRef.current, strokes: strokes.slice(0, -1) });
  };

  const savedLabel =
    savedAt > 0
      ? yjT("academy.notesSaved", loc).replace(
          "{t}",
          new Date(savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        )
      : "";

  return (
    <>
      <button type="button" className="btn ghost small" onClick={() => setOpen(true)}>
        ✎ {yjT("academy.notes", loc)}
        {exists && (
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

      {open && (
        <>
          {narrow && (
            <div
              aria-hidden
              onClick={() => setOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.4)",
                zIndex: 79,
              }}
            />
          )}
          <div
            role="dialog"
            aria-label={yjT("academy.notes", loc)}
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              height: "100dvh",
              width: narrow ? "94vw" : "clamp(340px, 42vw, 520px)",
              background: "var(--card)",
              borderLeft: "1px solid var(--line)",
              boxShadow: "-12px 0 32px rgba(0,0,0,0.18)",
              zIndex: 80,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                padding: "0.9rem 1rem",
                borderBottom: "1px solid var(--line)",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {title}
                </div>
                <div className="muted" style={{ fontSize: "13px" }}>
                  {yjT("academy.notes", loc)}
                  {savedLabel ? ` · ${savedLabel}` : ""}
                </div>
              </div>
              <button
                type="button"
                className="btn ghost small"
                aria-label={yjT("academy.notesClose", loc)}
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", padding: "0.7rem 1rem 0" }}>
              <button
                type="button"
                className={tab === "text" ? "btn small" : "btn ghost small"}
                onClick={() => setTab("text")}
              >
                {yjT("academy.notesText", loc)}
              </button>
              <button
                type="button"
                className={tab === "draw" ? "btn small" : "btn ghost small"}
                onClick={() => setTab("draw")}
              >
                {yjT("academy.notesDraw", loc)}
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "0.8rem 1rem 1rem" }}>
              {tab === "text" ? (
                <>
                  <textarea
                    value={note.text}
                    onChange={(e) => update({ ...noteRef.current, text: e.target.value })}
                    placeholder={yjT("academy.notesPlaceholder", loc)}
                    aria-label={yjT("academy.notesText", loc)}
                    style={{
                      width: "100%",
                      minHeight: "46dvh",
                      padding: "0.8rem",
                      fontSize: "1rem",
                      lineHeight: 1.8,
                      color: "inherit",
                      background: "var(--bg)",
                      border: "1px solid var(--line)",
                      borderRadius: "var(--radius)",
                      resize: "vertical",
                      fontFamily: "inherit",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: "0.6rem",
                    }}
                  >
                    <span className="muted" style={{ fontSize: "13px" }}>
                      {yjT("academy.notesChars", loc).replace("{n}", String(note.text.length))}
                    </span>
                    <button
                      type="button"
                      className="btn ghost small"
                      onClick={clearText}
                      disabled={note.text === ""}
                    >
                      {yjT("academy.notesClear", loc)}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {note.strokes.length === 0 && (
                    <p className="muted" style={{ marginTop: 0, fontSize: "13px" }}>
                      {yjT("academy.notesEmpty", loc)}
                    </p>
                  )}
                  <canvas
                    ref={canvasRef}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                    aria-label={yjT("academy.notesDraw", loc)}
                    style={{
                      width: "100%",
                      aspectRatio: "3 / 4",
                      display: "block",
                      touchAction: "none",
                      background: "var(--bg)",
                      border: "1px solid var(--line)",
                      borderRadius: "var(--radius)",
                      cursor: "crosshair",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      flexWrap: "wrap",
                      marginTop: "0.6rem",
                    }}
                  >
                    <button
                      type="button"
                      className="btn ghost small"
                      onClick={undoStroke}
                      disabled={note.strokes.length === 0}
                    >
                      {yjT("academy.notesUndo", loc)}
                    </button>
                    <button
                      type="button"
                      className={grid ? "btn small" : "btn ghost small"}
                      aria-pressed={grid}
                      onClick={() => setGrid((g) => !g)}
                    >
                      {yjT("academy.notesGrid", loc)}
                    </button>
                    <button
                      type="button"
                      className="btn ghost small"
                      onClick={clearDraw}
                      disabled={note.strokes.length === 0}
                    >
                      {yjT("academy.notesClearDraw", loc)}
                    </button>
                  </div>
                </>
              )}
              <p className="muted" style={{ fontSize: "13px", marginTop: "0.9rem" }}>
                {yjT("academy.notesLocal", loc)}
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
