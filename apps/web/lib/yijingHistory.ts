import { castYijing, castMeihua, type CoinLine } from "@numerology/engine";

/**
 * 易經占卦歷史 —— **只存本機**(IndexedDB,同 numerology DB 嘅 yijing store),不上 server。
 * 銅錢占卦 / 梅花易數 / 六爻納甲起卦完成自動存一條;歷史頁撳入去經 ?h=<id>
 * 返去原本工具睇返完整卦象(AI 解卦經 KV 緩存即出,唔使重算)。
 */

export type YijingCastKind = "coin" | "meihua" | "liuyao";

export interface YijingCast {
  id: string;
  kind: YijingCastKind;
  /** 起卦時間戳 */
  at: number;
  /** 銅錢占卦:用戶問題(選填) */
  question?: string;
  /** 銅錢/六爻:六爻爻值(6/7/8/9,由下而上) */
  lines?: number[];
  /** 銅錢:每爻三枚銅錢(字=true/花=false),還原擲錢畫面用 */
  coins?: [boolean, boolean, boolean][];
  /** 梅花:起卦時間 "YYYY-MM-DDTHH:mm" */
  datetime?: string;
  /** 六爻:起卦日期 "YYYY-MM-DD" */
  date?: string;
}

export interface YijingCastSummary {
  /** 本卦卦序 */
  hexagram: number;
  /** 變卦卦序(null=無變卦) */
  changed: number | null;
  /** 動爻位置(1-6,由下而上) */
  moving: number[];
  /** 梅花:體用斷級別(大吉/中吉/小吉/小凶/大凶) */
  verdict?: string;
}

/** 純函數:由記錄還原卦象摘要(列表顯示用,不碰 IndexedDB)。 */
export function summarizeYijingCast(r: YijingCast): YijingCastSummary | null {
  try {
    if (r.kind === "coin" || r.kind === "liuyao") {
      if (!r.lines || r.lines.length !== 6) return null;
      const c = castYijing(r.lines as [CoinLine, CoinLine, CoinLine, CoinLine, CoinLine, CoinLine]);
      return { hexagram: c.hexagram, changed: c.changed ?? null, moving: c.changing };
    }
    if (r.kind === "meihua") {
      const m = r.datetime?.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
      if (!m) return null;
      const res = castMeihua(+m[1]!, +m[2]!, +m[3]!, +m[4]!);
      return {
        hexagram: res.hexagram,
        changed: res.changed ?? null,
        moving: [res.movingLine],
        verdict: res.verdict.level,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function newId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/* ———————————————————— IndexedDB ———————————————————— */

const DB_NAME = "numerology";
const DB_VERSION = 2;
const STORE = "yijing";
const READINGS_STORE = "readings";
const EVENT = "numerology-yijing-history-changed";

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
      // 同 history.ts 保持一致:兩個 store 唔存在就建,舊數據保留
      if (!db.objectStoreNames.contains(READINGS_STORE)) {
        db.createObjectStore(READINGS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
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

/** 起卦完成存一條(每次起卦獨立一條,唔合併)。 */
export async function saveYijingCast(input: Omit<YijingCast, "id">): Promise<YijingCast> {
  const rec: YijingCast = { ...input, id: newId() };
  await tx("readwrite", (s) => s.put(rec));
  notifyChanged();
  return rec;
}

export async function getYijingCast(id: string): Promise<YijingCast | null> {
  return (await tx("readonly", (s) => s.get(id)).catch(() => null)) as YijingCast | null;
}

/** 按起卦時間倒序列出。 */
export async function listYijingCasts(): Promise<YijingCast[]> {
  const all = (await tx("readonly", (s) => s.getAll()).catch(() => [])) as YijingCast[];
  return all.sort((a, b) => b.at - a.at);
}

export async function deleteYijingCast(id: string): Promise<void> {
  await tx("readwrite", (s) => s.delete(id));
  notifyChanged();
}

export function notifyYijingHistoryChanged(): void {
  notifyChanged();
}

function notifyChanged(): void {
  try {
    if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
  } catch {
    /* ignore */
  }
}

export function onYijingHistoryChanged(fn: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, fn);
  return () => window.removeEventListener(EVENT, fn);
}
