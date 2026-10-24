import { getRequestContext } from "@cloudflare/next-on-pages";

/**
 * 从 Cloudflare Pages 的 request context 取服务端 binding(仅服务端调用)。
 *
 * - `AI`:Workers AI binding(Settings > Bindings 中添加)。
 * - `AI_BUDGET_KV`:用量预算 KV(Settings > Bindings 中添加)。
 *
 * 在 Cloudflare 之外(本地 next dev) getRequestContext() 会抛错 → 返回 null,
 * 由 provider 层给出明确报错(提示配置 binding 或切换其它 provider)。
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
 * Mac LLM 的 Cloudflare Access service token headers(仅服务端从 Pages env 读)。
 * 非 Pages 环境(getRequestContext 抛错)或未配置时返回 undefined(保持旧行为)。
 * secret 绝不进日志、不进响应,只随服务端请求发往 ollama.hectorchan.com。
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
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * 取 Cloudflare 的 waitUntil(用于响应返回后继续做缓存写入等后台工作)。
 * 非 Cloudflare 环境(本地 next dev)返回 null。
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
