import type { ProviderOptions } from "@numerology/ai";
import { getServerAiBindings } from "./aiBinding.js";

/**
 * 从请求体解析 BYOK 设置(用户自带 provider/key)与自定义人设;仅透传、不落库、不记日志。
 * `systemPrompt` 取请求体**顶层**字段(与 `locale` 同级),而非塞进 `ai`:
 * 它是每次请求的用户覆盖项(像 locale 一样),保持 `ai` 的 BYOK 形状稳定。
 */
export function parseAi(body: unknown): ProviderOptions | undefined {
  const b = (body ?? {}) as { ai?: Record<string, unknown>; systemPrompt?: unknown };
  const ai = b.ai;
  if (!ai || typeof ai !== "object") {
    const sp = typeof b.systemPrompt === "string" ? b.systemPrompt.trim() : "";
    return sp ? { customSystemPrompt: sp } : undefined;
  }
  const s = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
  const sp = typeof b.systemPrompt === "string" ? b.systemPrompt.trim() : "";
  const opts: ProviderOptions = {
    provider: s(ai.provider),
    apiKey: s(ai.apiKey),
    model: s(ai.model),
    baseURL: s(ai.baseURL),
    ...(sp ? { customSystemPrompt: sp } : {}),
  };
  return opts.provider || opts.apiKey || opts.model || opts.baseURL || opts.customSystemPrompt
    ? opts
    : undefined;
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
  return opts.provider || opts.apiKey || opts.model || opts.baseURL || opts.customSystemPrompt || opts.aiBinding
    ? opts
    : undefined;
}
