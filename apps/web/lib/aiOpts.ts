import type { ProviderOptions } from "@numerology/ai";
import { getServerAiBindings, getMacLlmAccessHeaders } from "./aiBinding.js";
import { isMacProvider } from "./providerMeta.js";

/**
 * 從請求體解析 BYOK 設置(用戶自帶 provider/key)與自定義人設;僅透傳、不落庫、不記日誌。
 * `systemPrompt` 取請求體**頂層**字段(與 `locale` 同級),而非塞進 `ai`:
 * 它是每次請求的用戶覆蓋項(像 locale 一樣),保持 `ai` 的 BYOK 形狀穩定。
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
 * 服務端:解析 BYOK,並掛上 Workers AI 的服務端 binding。
 * aiBinding 只存在於服務端內存對象中——parseAi 絕不從請求體讀取它,
 * 故客戶端無法僞造或窺探;也不會被序列化進任何響應。
 */
export function resolveServerAi(body: unknown): ProviderOptions | undefined {
  const opts: ProviderOptions = parseAi(body) ?? {};
  const bindings = getServerAiBindings();
  if (bindings) opts.aiBinding = bindings;
  // Mac provider(mac-llm;舊名 mac-mlx 亦認):附上 Cloudflare Access
  // service token headers(僅服務端 env,絕不來自請求體)。
  if (opts.provider && isMacProvider(opts.provider)) {
    const h = getMacLlmAccessHeaders();
    if (h) opts.extraHeaders = h;
  }
  return opts.provider || opts.apiKey || opts.model || opts.baseURL || opts.customSystemPrompt || opts.aiBinding
    ? opts
    : undefined;
}
