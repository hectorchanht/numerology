import type { ProviderOptions } from "@numerology/ai";
import { getServerAiBindings } from "./aiBinding";

/** 从请求体解析 BYOK 设置(用户自带 provider/key);仅透传、不落库、不记日志。 */
export function parseAi(body: unknown): ProviderOptions | undefined {
  const ai = (body as { ai?: Record<string, unknown> } | null)?.ai;
  if (!ai || typeof ai !== "object") return undefined;
  const s = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
  const opts: ProviderOptions = {
    provider: s(ai.provider),
    apiKey: s(ai.apiKey),
    model: s(ai.model),
    baseURL: s(ai.baseURL),
  };
  return opts.provider || opts.apiKey || opts.model || opts.baseURL ? opts : undefined;
}

/**
 * 服务端:解析 BYOK,并挂上 Workers AI 的服务端 binding。
 * aiBinding 只存在于服务端内存对象中——parseAi 绝不从请求体读取它,
 * 故客户端无法伪造或窥探;也不会被序列化进任何响应。
 */
export function resolveServerAi(body: unknown): ProviderOptions | undefined {
  const opts: ProviderOptions = parseAi(body) ?? {};
  const bindings = getServerAiBindings();
  if (bindings) opts.aiBinding = bindings;
  return opts.provider || opts.apiKey || opts.model || opts.baseURL || opts.aiBinding
    ? opts
    : undefined;
}
