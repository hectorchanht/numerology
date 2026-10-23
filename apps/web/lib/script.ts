import { lockScriptSync, warmScript, type ZhScript } from "@dawn-studio/zh-convert";
import type { TextStream } from "@numerology/ai";
import type { Locale } from "./i18n.js";

/**
 * 字形鎖(簡⇄繁)——全站唯一入口,底層用 @dawn-studio/zh-convert(tongwen 詞組級、冪等)。
 *
 * 原則:引擎 / iztro / AI 輸出保持原樣(canonical),只喺「顯示邊界」按 locale 轉:
 * - UI:組件用 useScript().z(i18n.ts),或者純函數 lockScript(poster 等)。
 * - AI:API 路由用 scriptLocker + lockTextStream,喺寫 KV 緩存之前轉,緩存命中亦再鎖一次(冪等)。
 * 字典懶加載、每個 runtime 只建一次(warmScriptFor 記住 promise);冷嘅時候一律原樣返回,唔會 throw。
 */

/** UI 字形:zht 繁、zhs 簡;en 頁面上嘅中文(星曜/干支)跟長期規則用繁體。 */
export const LOCALE_SCRIPT: Record<Locale, ZhScript> = { zht: "zh-Hant", zhs: "zh-Hans", en: "zh-Hant" };

/** AI 正文字形:en 回覆係英文,唔鎖。 */
const AI_SCRIPT: Record<Locale, ZhScript | null> = { zht: "zh-Hant", zhs: "zh-Hans", en: null };

const warm: Record<ZhScript, boolean> = { "zh-Hant": false, "zh-Hans": false };
const pending: Partial<Record<ZhScript, Promise<void>>> = {};
const listeners = new Set<() => void>();

/** 預熱某字形嘅字典(全 runtime 一次;重複調用共用同一 promise,永不 reject)。 */
export function warmScriptFor(target: ZhScript): Promise<void> {
  if (warm[target]) return Promise.resolve();
  return (pending[target] ??= warmScript(target).then(() => {
    warm[target] = true;
    listeners.forEach((fn) => fn());
  }));
}

export function isScriptWarm(target: ZhScript): boolean {
  return warm[target];
}

/** 訂閱「字典熱咗」事件(useSyncExternalStore 用)。 */
export function subscribeScript(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/**
 * 將一段字鎖去 locale 嘅字形(UI 用)。非中文原樣;字典未熱 → 原樣。
 * from = 來源字形:引擎 / iztro 出簡體(預設 "zh-Hans");知識庫(卦爻辭、術語表)係繁體正本,
 * 傳 "zh-Hant" → 繁體目標就唔郁。原因:s2t 會將古籍異體「正規化」(系→繫、御→禦、牀→床),
 * 繁體正本唔應該被改。(簡體目標照轉:t2s 對簡體係 no-op,仲順手修正舊記錄存咗嘅繁體。)
 */
/**
 * 占(卜筮義)保護:tongwen s2t 會將「占」→「佔」,但占卜/占例/占辭等必須保留「占」
 * (實測 lockScriptSync('易經占例庫','zh-Hant') → '易經佔例庫')。
 * 策略:轉換前將「占(唔係占有)」換成 PUA 佔位,轉完還原。
 * 「占有」照舊轉「佔有」(正確繁體);t2s 方向唔受影響(佔→占本來就啱)。
 */
const ZHAN_GUARD = "";
const ZHAN_RE = /占(?!有)/g;
function guardZhan(s: string): string {
  return s.replace(ZHAN_RE, ZHAN_GUARD);
}
function unguardZhan(s: string): string {
  return s.replaceAll(ZHAN_GUARD, "占");
}

export function lockScript(text: string, loc: Locale, from: ZhScript = "zh-Hans"): string {
  const target = LOCALE_SCRIPT[loc];
  if (!text || (from === "zh-Hant" && target === "zh-Hant")) return text;
  return unguardZhan(lockScriptSync(guardZhan(text), target));
}

/**
 * AI 輸出用:預熱好字典後回傳鎖字函數;en 回傳 null(唔使轉)。
 * 純 CPU,零 AI 調用。
 */
export async function scriptLocker(loc: Locale): Promise<((s: string) => string) | null> {
  const target = AI_SCRIPT[loc];
  if (!target) return null;
  await warmScriptFor(target);
  return (s) => (s ? unguardZhan(lockScriptSync(guardZhan(s), target)) : s);
}

/** 安全斷點:換行、空白、中英標點之後(詞組唔會跨呢啲字)。 */
const BREAK = /[\s。!?;,、:」』)】》.!?;,:)]/u;

/**
 * 包住 AI 文本流:逐塊累積,只喺安全斷點前嘅部分做轉換再發出,尾巴留待下一塊
 * (避免「头|发」被切開逐字轉錯)。finalMessage 成功時先沖走尾巴,保證下游
 * (streamToPrimedResponse / 緩存 tee)喺收尾之前收齊全部已轉換文字。
 * lock 為 null → 原樣返回 stream。
 */
export function lockTextStream(inner: TextStream, lock: ((s: string) => string) | null): TextStream {
  if (!lock) return inner;
  const textListeners: Array<(d: string) => void> = [];
  let attached = false;
  let tail = "";
  const emit = (s: string): void => {
    if (!s) return;
    const out = lock(s);
    for (const l of [...textListeners]) l(out);
  };
  let final: Promise<unknown> | null = null;
  const stream: TextStream = {
    on(event: "text" | "error", listener: (arg: never) => void): unknown {
      if (event === "text") {
        if (!attached) {
          attached = true;
          inner.on("text", (d: string) => {
            const buf = tail + d;
            let cut = -1;
            for (let i = buf.length - 1; i >= 0; i--) {
              if (BREAK.test(buf[i]!)) {
                cut = i + 1;
                break;
              }
            }
            if (cut <= 0) {
              tail = buf;
              return;
            }
            tail = buf.slice(cut);
            emit(buf.slice(0, cut));
          });
        }
        textListeners.push(listener as (d: string) => void);
      } else {
        inner.on("error", listener as (e: unknown) => void);
      }
      return stream;
    },
    finalMessage(): Promise<unknown> {
      // 記住同一個 promise:多個調用者(預熱、正式、緩存寫入)都喺沖完尾巴之後先收到 resolve。
      return (final ??= inner.finalMessage().then((r) => {
        const rest = tail;
        tail = "";
        emit(rest);
        return r;
      }));
    },
    abort(): void {
      inner.abort();
    },
  };
  return stream;
}
