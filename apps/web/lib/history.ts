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
  /** 用戶自定名稱(選填)。刻意唔入 id hash:改名唔會分裂記錄,舊記錄無痛兼容。 */
  name?: string;
  /** key: "report:<sectionKey>" | "fortune:<sectionKey>" */
  sections: Record<string, HistorySection>;
}

const DB_NAME = "numerology";
/** v2:加 yijing store(易經占卦歷史);同 lib/yijingHistory.ts 保持一致。 */
const DB_VERSION = 2;
const YIJING_STORE = "yijing";
const STORE = "readings";
const HISTORY_EVENT = "numerology-history-changed";

function idb(): IDBFactory | null {
  return typeof indexedDB !== "undefined" ? indexedDB : null;
}

function openDb(): Promise<IDBDatabase> {
  const f = idb();
  if (!f) return Promise.reject(new Error("当前环境不支持 IndexedDB"));
  return new Promise((resolve, reject) => {
    const req = f.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(YIJING_STORE)) {
        db.createObjectStore(YIJING_STORE, { keyPath: "id" });
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
 * name:有非空值就寫入;空/undefined 就保留舊名(還原/重排都唔會靜靜洗走名)。
 * 返回保存后的记录。
 */
export async function upsertReading(input: {
  input: BirthInput;
  locale: Locale;
  chart: ChartResult;
  name?: string;
}): Promise<Reading> {
  const id = await readingId(input.input);
  const now = Date.now();
  const existing = (await tx("readonly", (s) => s.get(id)).catch(() => null)) as Reading | null;
  const trimmed = input.name?.trim();
  const rec: Reading = {
    id,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    input: input.input,
    locale: input.locale,
    chart: input.chart,
    ...(trimmed ? { name: trimmed } : existing?.name ? { name: existing.name } : {}),
    sections: existing?.sections ?? {},
  };
  await tx("readwrite", (s) => s.put(rec));
  notifyHistoryChanged();
  return rec;
}

/** 改名(改做空字串 = 清除名,之後顯示生日摘要)。記錄不存在則靜默返回。 */
export async function renameReading(id: string, name: string): Promise<void> {
  const existing = (await tx("readonly", (s) => s.get(id)).catch(() => null)) as Reading | null;
  if (!existing) return;
  const trimmed = name.trim();
  const rec: Reading = { ...existing, updatedAt: Date.now() };
  if (trimmed) rec.name = trimmed;
  else delete rec.name;
  await tx("readwrite", (s) => s.put(rec));
  notifyHistoryChanged();
}

/** 列表顯示名:有名顯示名,無名顯示生日摘要。 */
export function displayName(r: Reading): string {
  return r.name?.trim() ? r.name.trim() : summarizeInput(r.input);
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
