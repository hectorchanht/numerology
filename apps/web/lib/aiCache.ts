import type { TextStream } from "@numerology/ai";
import { sha256hex } from "./hash.js";

/**
 * AI 响应服务端缓存(省 Workers AI 预算)。
 *
 * 设计:
 * - 复用已绑定的 `AI_BUDGET_KV`,键前缀 `aicache:`,与预算键(`ai-budget:`)区分。
 * - 缓存键 = sha256(JSON{provider,model,locale,lens,section,inputHash,promptHash})。
 *   命盘是出生输入的确定性函数,故同一输入+同一配置 → 同一响应,可安全复用。
 *   `promptHash` 覆盖用户自定义人设:改了人设 → 键不同 → 不会串味。
 * - 只缓存**完整成功**的响应:流式 tee 累积全文,finalMessage 成功 resolve 后才
 *   经 waitUntil 写入;出错/截断/空文本一律不写。
 * - 不缓存 chat / infer-time(对话型,历史相关,命中率极低)。
 */

export const AI_CACHE_PREFIX = "aicache:";
export const AI_CACHE_TTL_SECONDS = 90 * 24 * 3600; // 90 天

export interface AiCacheKeyParts {
  /** 生效 provider(小写,如 workers-ai)。 */
  provider: string;
  /** 生效模型名;显式覆盖则用之,否则 ""(同一部署下 provider 默认模型确定)。 */
  model: string;
  locale: string;
  lens?: string;
  /** 缺省 = 整篇模式。 */
  section?: string;
  /** 出生输入的规范化哈希(stableInputHash)。 */
  inputHash: string;
  /** 自定义人设的哈希(空 = 默认人设)。 */
  promptHash: string;
}

/** 由各部分算出稳定的缓存键。 */
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

/** KV 的最小接口(AI_BUDGET_KV binding 的子集,便于测试注入)。 */
export interface KvLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
}

export interface CachedStream {
  stream: TextStream;
  cacheKey: string;
  /**
   * 在拿到最终 Response 后调用:注册后台缓存写入(waitUntil)。
   * 只在流**成功完成**且正文非空时写入;失败/截断/空一律不写。
   */
  armPersistence: (waitUntil: ((p: Promise<unknown>) => void) | null) => void;
}

/**
 * 缓存编排:先查 KV,命中直接返回 Response(`X-Cache: HIT`);未命中则创建
 * tee 包装的流,调用方走完 streamToPrimedResponse 后调 `armPersistence()`
 * 注册后台写入(`X-Cache: MISS`)。
 */
export async function prepareCachedStream(
  kv: KvLike | null,
  parts: AiCacheKeyParts,
  makeStream: () => TextStream,
): Promise<{ hit: Response } | { miss: CachedStream }> {
  const key = await aiCacheKey(parts);
  if (kv) {
    try {
      const hit = await kv.get(key);
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
      /* 读失败按 miss 处理 */
    }
  }
  const { stream, acc } = teeTextStream(makeStream());
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
                  /* 写入失败不影响已返回的响应 */
                }
              }
            },
            () => {
              /* 生成失败:不缓存 */
            },
          ),
        );
      },
    },
  };
}

/**
 * 包装 TextStream:所有事件原样转发,同时把 text 块累积进 `acc.text`。
 * 供 streamToPrimedResponse 消费;正文不受影响。
 */
export function teeTextStream(inner: TextStream): { stream: TextStream; acc: { text: string } } {
  const acc = { text: "" };
  const stream: TextStream = {
    on(event: "text" | "error", listener: (arg: never) => void): unknown {
      if (event === "text") {
        inner.on("text", (d: string) => {
          acc.text += d;
          (listener as (d: string) => void)(d);
        });
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
