/**
 * 單課筆記儲存(local-first):文字 + 手寫筆跡,只存此裝置 localStorage,不上傳。
 * 純函數 serialize/parse 方便測試;load/save 包 try/catch,私密模式/配額爆咗都靜默回落。
 */

/** 筆跡一點:x/y 為相對畫布 0–1 歸一化座標,p 為筆壓 0–1。 */
export interface NotePoint {
  x: number;
  y: number;
  p: number;
}

/** 一筆 = 一串點。 */
export type Stroke = NotePoint[];

export interface LessonNote {
  text: string;
  strokes: Stroke[];
  updatedAt: number;
}

export const LESSON_NOTE_PREFIX = "yijing-academy-note:";

export function noteKey(lessonId: string): string {
  return `${LESSON_NOTE_PREFIX}${lessonId}`;
}

export function emptyNote(): LessonNote {
  return { text: "", strokes: [], updatedAt: 0 };
}

export function serializeNote(note: LessonNote): string {
  return JSON.stringify(note);
}

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

function parsePoint(raw: unknown): NotePoint | null {
  if (!raw || typeof raw !== "object") return null;
  const { x, y, p } = raw as Record<string, unknown>;
  if (typeof x !== "number" || typeof y !== "number") return null;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  const pressure = typeof p === "number" && Number.isFinite(p) ? p : 0.5;
  return { x: clamp01(x), y: clamp01(y), p: clamp01(pressure) };
}

function parseStrokes(raw: unknown): Stroke[] {
  if (!Array.isArray(raw)) return [];
  const strokes: Stroke[] = [];
  for (const s of raw) {
    if (!Array.isArray(s)) continue;
    const pts = s.map(parsePoint).filter((pt): pt is NotePoint => pt !== null);
    if (pts.length > 0) strokes.push(pts);
  }
  return strokes;
}

/** 防禦式解析:接受 JSON 字串或已 parse 物件;任何垃圾 → 空筆記,唔拋錯。 */
export function parseNote(raw: unknown): LessonNote {
  let obj: unknown = raw;
  if (typeof raw === "string") {
    if (!raw) return emptyNote();
    try {
      obj = JSON.parse(raw);
    } catch {
      return emptyNote();
    }
  }
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return emptyNote();
  const o = obj as Record<string, unknown>;
  if (typeof o.text !== "string") return emptyNote();
  return {
    text: o.text,
    strokes: parseStrokes(o.strokes),
    updatedAt:
      typeof o.updatedAt === "number" && Number.isFinite(o.updatedAt) ? o.updatedAt : 0,
  };
}

export function loadNote(lessonId: string): LessonNote {
  try {
    return parseNote(localStorage.getItem(noteKey(lessonId)));
  } catch {
    return emptyNote();
  }
}

export function saveNote(lessonId: string, note: LessonNote): void {
  try {
    localStorage.setItem(noteKey(lessonId), serializeNote(note));
  } catch {
    /* 私密模式/配額滿:靜默忽略,記憶體狀態照用 */
  }
}

/** 有實質內容(非空白文字或任何筆跡)先算「有筆記」。 */
export function hasNote(lessonId: string): boolean {
  const n = loadNote(lessonId);
  return n.text.trim() !== "" || n.strokes.length > 0;
}

/** 學習模板需要嘅固定標籤(由 UI 層按 locale 傳入,保持呢度純函數)。 */
export interface NoteTemplateLabels {
  annotate: string;
  quiz: string;
  answer: string;
  summary: string;
  unclear: string;
}

/** 由課文資料砌學習模板:課名 → 逐節註解位 → 小測默答 → 總結/未明。字串全部由 UI 層本地化後傳入。 */
export function buildNoteTemplate(
  lesson: { title: string; sections: { heading: string }[]; quiz: { q: string }[] },
  labels: NoteTemplateLabels,
): string {
  const lines: string[] = [lesson.title, ""];
  lesson.sections.forEach((s, i) => {
    lines.push(`${i + 1}. ${s.heading}`);
    lines.push(`${labels.annotate}：`, "", "");
  });
  if (lesson.quiz.length > 0) {
    lines.push(`【${labels.quiz}】`);
    lesson.quiz.forEach((q, i) => {
      lines.push(`Q${i + 1} ${q.q}`);
      lines.push(`${labels.answer}：`, "");
    });
  }
  lines.push(`${labels.summary}：`, "", `${labels.unclear}：`, "");
  return lines.join("\n");
}
