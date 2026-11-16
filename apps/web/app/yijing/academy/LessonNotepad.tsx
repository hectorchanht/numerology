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
import { Icon } from "@/components/Icon";

/**
 * 單課筆記面板(受控:開關狀態由 LessonView 持有,方便同課文並排分欄)。
 * 窄屏(<768px)= 右邊抽屜 + 遮罩 + 鎖背景捲動;≥768px = 版面右欄 sticky,同課文各佔一半。
 * 內容經 notes.ts 存 localStorage(只喺此裝置),寫入 debounce 400ms。
 * 手寫用 Pointer Events 食 Apple Pencil 筆壓;座標歸一化 0–1,ResizeObserver 跟實畫布尺寸重畫。
 */
export function LessonNotepad({
  lessonId,
  title,
  template,
  open,
  onClose,
}: {
  lessonId: string;
  title: string;
  /** 學習模板(由 LessonView 按課文資料 + locale 砌好);文字 tab 一撳套用。 */
  template: string;
  open: boolean;
  onClose: () => void;
}) {
  const { locale } = useLocale();
  const loc = locale as YijingLocale;
  const [narrow, setNarrow] = useState(false);
  const [tab, setTab] = useState<"text" | "draw">("text");
  const [note, setNote] = useState<LessonNote>(emptyNote());
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
    setSavedAt(n.updatedAt);
  }, [lessonId]);

  /* 窄屏判斷(<768px 先係抽屜模式:遮罩 + 鎖捲動) */
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767.98px)");
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

  /* 開面板:Esc 關閉;抽屜模式先鎖背景捲動。關閉時 flush 一次。 */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    let prev = "";
    if (narrow) {
      prev = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", onKey);
      if (narrow) document.documentElement.style.overflow = prev;
      flushSave();
    };
  }, [open, narrow, onClose, flushSave]);

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

  /* 畫布尺寸跟實元素(開關面板/分欄/旋轉/轉 tab 都觸發 ResizeObserver)→ 定尺寸 + 重畫 */
  useEffect(() => {
    if (!open || tab !== "draw") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      if (cw === 0 || ch === 0) return;
      const w = Math.round(cw * dpr);
      const h = Math.round(ch * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      redraw();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    return () => ro.disconnect();
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

  /* 套用學習模板:空筆記直接入;有文字就 confirm 後 append,永不覆蓋 */
  const applyTemplate = () => {
    const cur = noteRef.current.text;
    if (cur.trim() === "") {
      update({ ...noteRef.current, text: template });
      return;
    }
    if (!window.confirm(yjT("academy.notesTplConfirmAppend", loc))) return;
    update({ ...noteRef.current, text: `${cur.replace(/\s+$/, "")}\n\n${template}` });
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

  if (!open) return null;

  return (
    <>
      {narrow && <div className="notepad-backdrop" aria-hidden onClick={onClose} />}
      <div className="notepad-panel" role="dialog" aria-label={yjT("academy.notes", loc)}>
        <div className="notepad-head">
          <span className="np-name"><Icon name="edit" small /> {yjT("academy.notes", loc)}</span>
          <span className="np-lesson">{title}</span>
          <div className="seg compact" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "text"}
              className={tab === "text" ? "on" : ""}
              onClick={() => setTab("text")}
            >
              <Icon name="file" small /> {yjT("academy.notesText", loc)}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "draw"}
              className={tab === "draw" ? "on" : ""}
              onClick={() => setTab("draw")}
            >
              <Icon name="edit" small /> {yjT("academy.notesDraw", loc)}
            </button>
          </div>
          <button
            type="button"
            className="btn ghost small"
            style={{ padding: "0 10px" }}
            aria-label={yjT("academy.notesClose", loc)}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="notepad-body">
          {tab === "text" ? (
            <div className="np-tab">
              <textarea
                className="np-textarea"
                value={note.text}
                onChange={(e) => update({ ...noteRef.current, text: e.target.value })}
                placeholder={yjT("academy.notesPlaceholder", loc)}
                aria-label={yjT("academy.notesText", loc)}
              />
              <div className="np-tools" style={{ justifyContent: "space-between" }}>
                <span className="muted">
                  {yjT("academy.notesChars", loc).replace("{n}", String(note.text.length))}
                </span>
                <span style={{ display: "flex", gap: "6px" }}>
                  <button type="button" className="btn ghost small" onClick={applyTemplate}>
                    <Icon name="plus" small /> {yjT("academy.notesTemplate", loc)}
                  </button>
                  <button
                    type="button"
                    className="btn ghost small"
                    onClick={clearText}
                    disabled={note.text === ""}
                  >
                    <Icon name="trash" small /> {yjT("academy.notesClear", loc)}
                  </button>
                </span>
              </div>
            </div>
          ) : (
            <div className="np-tab">
              {note.strokes.length === 0 && (
                <p className="muted" style={{ margin: "0 0 6px", fontSize: "13px" }}>
                  {yjT("academy.notesEmpty", loc)}
                </p>
              )}
              <div className="np-canvas-wrap">
                <canvas
                  ref={canvasRef}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  aria-label={yjT("academy.notesDraw", loc)}
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    touchAction: "none",
                    background: "var(--bg)",
                    border: "1px solid var(--line)",
                    borderRadius: "var(--radius)",
                    cursor: "crosshair",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div className="np-tools">
                <button
                  type="button"
                  className="btn ghost small"
                  onClick={undoStroke}
                  disabled={note.strokes.length === 0}
                >
                  <Icon name="rewind" small /> {yjT("academy.notesUndo", loc)}
                </button>
                <button
                  type="button"
                  className={grid ? "btn small" : "btn ghost small"}
                  aria-pressed={grid}
                  onClick={() => setGrid((g) => !g)}
                >
                  <Icon name="grid" small /> {yjT("academy.notesGrid", loc)}
                </button>
                <button
                  type="button"
                  className="btn ghost small"
                  onClick={clearDraw}
                  disabled={note.strokes.length === 0}
                >
                  <Icon name="trash" small /> {yjT("academy.notesClearDraw", loc)}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="notepad-foot">
          <span>{yjT("academy.notesLocal", loc)}</span>
          {savedLabel && <span>{savedLabel}</span>}
        </div>
      </div>
    </>
  );
}
