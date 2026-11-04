import { getRequestContext } from "@cloudflare/next-on-pages";

/**
 * 從 Cloudflare Pages 的 request context 取服務端 binding(僅服務端調用)。
 *
 * - `AI`:Workers AI binding(Settings > Bindings 中添加)。
 * - `AI_BUDGET_KV`:用量預算 KV(Settings > Bindings 中添加)。
 *
 * 在 Cloudflare 之外(本地 next dev) getRequestContext() 會拋錯 → 返回 null,
 * 由 provider 層給出明確報錯(提示配置 binding 或切換其它 provider)。
 */
export interface ServerAiBindings {
  ai: unknown;
  kv: unknown;
}

export function getServerAiBindings(): ServerAiBindings | null {
  try {
    const ctx = getRequestContext() as unknown as { env?: Record<string, unknown> };
    const env = ctx?.env;
    if (!env || !env.AI) return null;
    return { ai: env.AI, kv: env.AI_BUDGET_KV ?? null };
  } catch {
    return null;
  }
}

/**
 * Mac provider(mac-llm;舊名 mac-mlx 已正規化)的 Cloudflare Access
 * service token headers(僅服務端從 Pages env 讀)。
 * 主路徑:getRequestContext().env;兜底:部分 edge runtime 同步進 globalThis.process.env。
 * 非 Pages 環境或未配置時返回 undefined(保持舊行為)。
 * secret 絕不進日誌、不進響應,只隨服務端請求發往 ollama.hectorchan.com。
 */
export function getMacLlmAccessHeaders(): Record<string, string> | undefined {
  try {
    const ctx = getRequestContext() as unknown as { env?: Record<string, unknown> };
    const env = ctx?.env;
    const id = env?.AI_MAC_LLM_ACCESS_CLIENT_ID;
    const secret = env?.AI_MAC_LLM_ACCESS_CLIENT_SECRET;
    if (typeof id === "string" && id && typeof secret === "string" && secret) {
      return { "CF-Access-Client-Id": id, "CF-Access-Client-Secret": secret };
    }
  } catch {
    // fall through to process.env fallback
  }
  try {
    const pe = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
    const id = pe?.AI_MAC_LLM_ACCESS_CLIENT_ID;
    const secret = pe?.AI_MAC_LLM_ACCESS_CLIENT_SECRET;
    if (id && secret) return { "CF-Access-Client-Id": id, "CF-Access-Client-Secret": secret };
  } catch {
    // ignore
  }
  return undefined;
}

/**
 * 取 Cloudflare 的 waitUntil(用於響應返回後繼續做緩存寫入等後台工作)。
 * 非 Cloudflare 環境(本地 next dev)返回 null。
 */
export function getWaitUntil(): ((p: Promise<unknown>) => void) | null {
  try {
    const ctx = getRequestContext() as unknown as {
      ctx?: { waitUntil?: (p: Promise<unknown>) => void };
    };
    const w = ctx?.ctx?.waitUntil;
    return typeof w === "function" ? w.bind(ctx.ctx) : null;
  } catch {
    return null;
  }
}
