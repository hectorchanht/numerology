import type { TextStream } from "@numerology/ai";
import { sha256hex } from "./hash.js";
import { lockTextStream } from "./script.js";

/**
 * AI 響應服務端緩存(省 Workers AI 預算)。
 *
 * 設計:
 * - 複用已綁定的 `AI_BUDGET_KV`,鍵前綴 `aicache:`,與預算鍵(`ai-budget:`)區分。
 * - 緩存鍵 = sha256(JSON{provider,model,locale,lens,section,inputHash,promptHash})。
 *   命盤是出生輸入的確定性函數,故同一輸入+同一配置 → 同一響應,可安全複用。
 *   `promptHash` 覆蓋用戶自定義人設:改了人設 → 鍵不同 → 不會串味。
 * - 只緩存**完整成功**的響應:流式 tee 累積全文,finalMessage 成功 resolve 後才
 *   經 waitUntil 寫入;出錯/截斷/空文本一律不寫。
 * - 不緩存 chat / infer-time(對話型,歷史相關,命中率極低)。
 */

// v1(aicache:) 因 tee 的重複累積 bug 已作廢,見下; bump 前綴即整體失效舊緩存。
export const AI_CACHE_PREFIX = "aicache:2:";
export const AI_CACHE_TTL_SECONDS = 90 * 24 * 3600; // 90 天

export interface AiCacheKeyParts {
  /** 生效 provider(小寫,如 workers-ai)。 */
  provider: string;
  /** 生效模型名;顯式覆蓋則用之,否則 ""(同一部署下 provider 默認模型確定)。 */
  model: string;
  locale: string;
  lens?: string;
  /** 缺省 = 整篇模式。 */
  section?: string;
  /** 出生輸入的規範化哈希(stableInputHash)。 */
  inputHash: string;
  /** 自定義人設的哈希(空 = 默認人設)。 */
  promptHash: string;
}

/** 由各部分算出穩定的緩存鍵。 */
export async function aiCacheKey(p: AiCacheKeyParts): Promise<string> {
  const norm = {
    provider: p.provider.trim().toLowerCase(),
    model: p.model.trim(),
    locale: p.locale,
    lens: p.lens ?? "",
    section: p.section ?? "",
    inputHash: p.inputHash,
    promptHash: p.promptHash,
  };
  return AI_CACHE_PREFIX + (await sha256hex(JSON.stringify(norm)));
}

/** KV 的最小接口(AI_BUDGET_KV binding 的子集,便於測試注入)。 */
export interface KvLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
}

export interface CachedStream {
  stream: TextStream;
  cacheKey: string;
  /**
   * 在拿到最終 Response 後調用:註冊後台緩存寫入(waitUntil)。
   * 只在流**成功完成**且正文非空時寫入;失敗/截斷/空一律不寫。
   */
  armPersistence: (waitUntil: ((p: Promise<unknown>) => void) | null) => void;
}

/**
 * 緩存編排:先查 KV,命中直接返回 Response(`X-Cache: HIT`);未命中則創建
 * tee 包裝的流,調用方走完 streamToPrimedResponse 後調 `armPersistence()`
 * 註冊後台寫入(`X-Cache: MISS`)。
 *
 * `lock`(scriptLocker 出嚟,可選):字形鎖。MISS → 先鎖字再 tee,所以直播同寫入
 * 緩存嘅都係已轉換正文;HIT → 再鎖一次(冪等,順手修正舊緩存),純 CPU 零 AI 調用。
 */
export async function prepareCachedStream(
  kv: KvLike | null,
  parts: AiCacheKeyParts,
  makeStream: () => TextStream,
  lock: ((s: string) => string) | null = null,
): Promise<{ hit: Response } | { miss: CachedStream }> {
  const key = await aiCacheKey(parts);
  if (kv) {
    try {
      const raw = await kv.get(key);
      const hit = raw && lock ? lock(raw) : raw;
      if (hit) {
        return {
          hit: new Response(hit, {
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Cache-Control": "public, max-age=86400",
              "X-Cache": "HIT",
            },
          }),
        };
      }
    } catch {
      /* 讀失敗按 miss 處理 */
    }
  }
  const { stream, acc } = teeTextStream(lockTextStream(makeStream(), lock));
  return {
    miss: {
      stream,
      cacheKey: key,
      armPersistence: (waitUntil) => {
        if (!kv || !waitUntil) return;
        waitUntil(
          stream.finalMessage().then(
            async () => {
              if (acc.text.trim()) {
                try {
                  await kv.put(key, acc.text, { expirationTtl: AI_CACHE_TTL_SECONDS });
                } catch {
                  /* 寫入失敗不影響已返回的響應 */
                }
              }
            },
            () => {
              /* 生成失敗:不緩存 */
            },
          ),
        );
      },
    },
  };
}

/**
 * 包裝 TextStream:所有事件原樣轉發,同時把 text 塊累積進 `acc.text`。
 * 供 streamToPrimedResponse 消費;正文不受影響。
 *
 * 關鍵:無論 wrapper 上掛多少個 text 監聽器(如預熱 + 正式各掛一個),
 * inner 上只掛**一個**監聽器並扇出——每塊恰好累積一次。
 * (舊實現每個 wrapper 監聽器都在 inner 上另掛一個,導致正文被重複累積。)
 */
export function teeTextStream(inner: TextStream): { stream: TextStream; acc: { text: string } } {
  const acc = { text: "" };
  const textListeners: Array<(d: string) => void> = [];
  let attached = false;
  const stream: TextStream = {
    on(event: "text" | "error", listener: (arg: never) => void): unknown {
      if (event === "text") {
        if (!attached) {
          attached = true;
          inner.on("text", (d: string) => {
            acc.text += d;
            for (const l of [...textListeners]) l(d);
          });
        }
        textListeners.push(listener as (d: string) => void);
      } else {
        inner.on("error", listener as (e: unknown) => void);
      }
      return stream;
    },
    finalMessage(): Promise<unknown> {
      return inner.finalMessage();
    },
    abort(): void {
      inner.abort();
    },
  };
  return { stream, acc };
}
