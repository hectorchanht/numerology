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
  /**
   * 每一節嘅全部 AI 解讀版本(最新第一,上限 20 版/節),key 同 sections 一致。
   * sections[key] 永遠 = sectionHistory[key] 嘅第一版(現行版)。
   * 舊記錄冇呢個字段:讀嗰陣由 versionsOf() 以現行版合成,零遷移。
   */
  sectionHistory?: Record<string, HistorySection[]>;
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

/** 每一節最多保留幾多個 AI 版本(舊版自動甩尾,避免 IndexedDB 無限膨脹)。 */
export const MAX_SECTION_VERSIONS = 20;

/** 版本同一性:時間 + 內文都一樣先算同一版(去重用)。 */
function sameVersion(a: HistorySection, b: HistorySection): boolean {
  return a.at === b.at && a.markdown === b.markdown;
}

/**
 * 纯函数:某一節嘅完整版本列表(最新第一、去重、上限 20)。
 * 現行版(sections[key])永遠排第一;舊記錄冇 sectionHistory 時就以現行版
 * 合成單一版本回傳——所以舊記錄零遷移都睇得返佢嗰一版解讀。
 */
export function versionsOf(r: Reading, key: string): HistorySection[] {
  const out: HistorySection[] = [];
  const push = (v?: HistorySection) => {
    if (!v || out.some((x) => sameVersion(x, v))) return;
    out.push(v);
  };
  push(r.sections?.[key]);
  for (const v of r.sectionHistory?.[key] ?? []) push(v);
  return out.slice(0, MAX_SECTION_VERSIONS);
}

/**
 * 纯函数:新一版 AI 解讀歸檔——新版做現行版,舊現行版唔再被覆蓋,
 * 而係留喺版本列表畀用戶之後睇返/逐版刪除。舊記錄首次歸檔時,
 * 原本嗰版(若內文不同)會自動做埋種子版本保留落嚟。
 */
export function archiveSectionInto(
  r: Reading,
  key: string,
  s: HistorySection,
): Reading {
  const rest = versionsOf(r, key).filter((v) => !sameVersion(v, s));
  const versions = [s, ...rest].slice(0, MAX_SECTION_VERSIONS);
  return {
    ...r,
    sections: { ...r.sections, [key]: s },
    sectionHistory: { ...(r.sectionHistory ?? {}), [key]: versions },
    updatedAt: s.at,
  };
}

/**
 * 纯函数:刪走某一節嘅指定版本(at 識別)。
 * 刪嘅係現行版 → 下一版自動升為現行版;刪埋最後一版 → 成節移除。
 * 版本唔存在就原樣回傳。
 */
export function deleteVersionFrom(r: Reading, key: string, at: number): Reading {
  const versions = versionsOf(r, key);
  const idx = versions.findIndex((v) => v.at === at);
  if (idx < 0) return r;
  const rest = versions.filter((_, i) => i !== idx);
  const sections = { ...r.sections };
  const sectionHistory = { ...(r.sectionHistory ?? {}) };
  if (rest.length > 0) {
    sections[key] = rest[0]!;
    sectionHistory[key] = rest;
  } else {
    delete sections[key];
    delete sectionHistory[key];
  }
  return { ...r, sections, sectionHistory };
}

/** 纯函数:把一节合并进记录(可测试,不碰 IndexedDB)。等同歸檔一版(舊版保留)。 */
export function mergeSectionInto(
  r: Reading,
  key: string,
  s: HistorySection,
): Reading {
  return archiveSectionInto(r, key, s);
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
    ...(existing?.sectionHistory ? { sectionHistory: existing.sectionHistory } : {}),
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

/** 保存一节(歸檔新版進已有记录,舊版保留;记录不存在则跳过)。 */
export async function saveSection(
  input: BirthInput,
  key: string,
  s: HistorySection,
): Promise<void> {
  const id = await readingId(input);
  const existing = (await tx("readonly", (st) => st.get(id)).catch(() => null)) as Reading | null;
  if (!existing) return;
  await tx("readwrite", (st) => st.put(archiveSectionInto(existing, key, s)));
  notifyHistoryChanged();
}

/** 刪走某一節嘅指定 AI 版本(刪現行版自動升下一版,見 deleteVersionFrom)。記錄/版本不存在則靜默返回。 */
export async function deleteSectionVersion(id: string, key: string, at: number): Promise<void> {
  const existing = (await tx("readonly", (s) => s.get(id)).catch(() => null)) as Reading | null;
  if (!existing) return;
  const next = deleteVersionFrom(existing, key, at);
  if (next === existing) return;
  await tx("readwrite", (s) => s.put(next));
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
