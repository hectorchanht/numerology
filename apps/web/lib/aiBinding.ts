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
