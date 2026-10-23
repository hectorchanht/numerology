import type { BirthInput, ChartResult } from "@numerology/engine";
import type { Locale } from "./i18n.js";
import { stableInputHash } from "./hash.js";

/**
 * 排盘历史记录 —— **只存本机**(IndexedDB),不上 server。
 * 用户点某条记录 → 瞬间恢复命盘 + 已生成的章节,零 API 调用。
 */

export interface HistorySection {
  /** 该节正文 markdown(不含 ## 标题,恢复时按当前语言重拼标题)。 */
  markdown: string;
  lens: string;
  provider: string;
  model: string;
  at: number;
}

export interface Reading {
  /** stableInputHash(input),同一组输入恒为同一 id。 */
  id: string;
  createdAt: number;
  updatedAt: number;
  input: BirthInput;
  locale: Locale;
  chart: ChartResult;
  /** key: "report:<sectionKey>" | "fortune:<sectionKey>" */
  sections: Record<string, HistorySection>;
}

const DB_NAME = "numerology";
const STORE = "readings";
const HISTORY_EVENT = "numerology-history-changed";

function idb(): IDBFactory | null {
  return typeof indexedDB !== "undefined" ? indexedDB : null;
}

function openDb(): Promise<IDBDatabase> {
  const f = idb();
  if (!f) return Promise.reject(new Error("当前环境不支持 IndexedDB"));
  return new Promise((resolve, reject) => {
    const req = f.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB 打开失败"));
  });
}

function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = fn(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error ?? new Error("IndexedDB 操作失败"));
        t.oncomplete = () => db.close();
        t.onerror = () => db.close();
      }),
  );
}

/** 输入 → 稳定记录 id。 */
export async function readingId(input: BirthInput): Promise<string> {
  return stableInputHash(input as unknown as Record<string, unknown>);
}

/** 纯函数:把一节合并进记录(可测试,不碰 IndexedDB)。 */
export function mergeSectionInto(
  r: Reading,
  key: string,
  s: HistorySection,
): Reading {
  return { ...r, sections: { ...r.sections, [key]: s }, updatedAt: s.at };
}

/** 纯函数:出生摘要,如 "1990-06-15 14:00 男"。 */
export function summarizeInput(input: BirthInput): string {
  const p2 = (n: number) => String(n).padStart(2, "0");
  return `${input.year}-${p2(input.month)}-${p2(input.day)} ${p2(input.hour)}:${p2(input.minute ?? 0)} ${input.gender}`;
}

/**
 * 新增或更新一条记录:已存在则保留旧章节,只更新命盘/输入/时间。
 * 返回保存后的记录。
 */
export async function upsertReading(input: {
  input: BirthInput;
  locale: Locale;
  chart: ChartResult;
}): Promise<Reading> {
  const id = await readingId(input.input);
  const now = Date.now();
  const existing = await tx("readonly", (s) => s.get(id)).catch(() => null);
  const rec: Reading = {
    id,
    createdAt: (existing as Reading | null)?.createdAt ?? now,
    updatedAt: now,
    input: input.input,
    locale: input.locale,
    chart: input.chart,
    sections: (existing as Reading | null)?.sections ?? {},
  };
  await tx("readwrite", (s) => s.put(rec));
  notifyHistoryChanged();
  return rec;
}

/** 保存一节(merge 进已有记录;记录不存在则跳过)。 */
export async function saveSection(
  input: BirthInput,
  key: string,
  s: HistorySection,
): Promise<void> {
  const id = await readingId(input);
  const existing = (await tx("readonly", (st) => st.get(id)).catch(() => null)) as Reading | null;
  if (!existing) return;
  await tx("readwrite", (st) => st.put(mergeSectionInto(existing, key, s)));
  notifyHistoryChanged();
}

export async function getReading(id: string): Promise<Reading | null> {
  return (await tx("readonly", (s) => s.get(id)).catch(() => null)) as Reading | null;
}

/** 按更新时间倒序列出。 */
export async function listReadings(): Promise<Reading[]> {
  const all = (await tx("readonly", (s) => s.getAll()).catch(() => [])) as Reading[];
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteReading(id: string): Promise<void> {
  await tx("readwrite", (s) => s.delete(id));
  notifyHistoryChanged();
}

export async function clearReadings(): Promise<void> {
  await tx("readwrite", (s) => s.clear());
  notifyHistoryChanged();
}

/** 通知 HistoryPanel 刷新(同页多处写记录时用)。 */
export function notifyHistoryChanged(): void {
  try {
    if (typeof window !== "undefined") window.dispatchEvent(new Event(HISTORY_EVENT));
  } catch {
    /* ignore */
  }
}

export function onHistoryChanged(fn: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(HISTORY_EVENT, fn);
  return () => window.removeEventListener(HISTORY_EVENT, fn);
}
