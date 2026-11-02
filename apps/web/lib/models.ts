import { WORKERS_AI_MODELS, WORKERS_AI_VERIFIED_AT } from "@numerology/ai";
import {
  deadModelIds,
  normDeadModelId,
  readDeadModels,
} from "@numerology/ai";
import { filterRetired, isMacProvider } from "./providerMeta.js";

export interface ModelEntry {
  id: string;
  /** openrouter 等返回的免费标记(便于界面标注)。 */
  free?: boolean;
}

export type ModelsSource = "live" | "verified-static" | "static";

export interface ModelsResult {
  provider: string;
  source: ModelsSource;
  models: ModelEntry[];
  /** 需要 key 才能拉取(如 401),前端回落到静态表并提示填 key。 */
  needsKey?: boolean;
  /** Mac provider 上游离线/失败时的软回落标记:仍回静态表,但前端可显示离线状态。 */
  offline?: boolean;
  verifiedAt?: string;
}

/** 各 provider 的 OpenAI 兼容 /models 端点(anthropic/custom 无标准端点 → 走静态)。 */
const MODELS_BASE_URL: Record<string, string> = {
  pollinations: "https://text.pollinations.ai/openai",
  "mac-llm": "https://ollama.hectorchan.com/v1",
  openrouter: "https://openrouter.ai/api/v1",
  glm: "https://open.bigmodel.cn/api/paas/v4",
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai",
  groq: "https://api.groq.com/openai/v1",
  ollama: "http://localhost:11434/v1",
};

/** anthropic 无 /models 端点:静态备选(与 SettingsPanel 旧表一致)。 */
const STATIC_MODELS: Record<string, string[]> = {
  anthropic: ["claude-sonnet-4-6", "claude-opus-4-8", "claude-haiku-4-5-20251001"],
  glm: ["glm-4-flash", "glm-4-flashx", "glm-4-air", "glm-4-plus", "glm-4-long"],
  gemini: ["gemini-3.8-flash", "gemini-flash-latest", "gemini-flash-lite-latest"],
  groq: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "gemma2-9b-it", "deepseek-r1-distill-llama-70b"],
  openrouter: ["google/gemma-4-31b-it:free", "google/gemma-4-26b-a4b-it:free", "nvidia/nemotron-3.5-lightning:free"],
  pollinations: ["openai"],
  // Mac 只行 Ollama(MLX 2026-11-02 停用):静态回落就是 Ollama 的 7 个模型。
  "mac-llm": [
    "qwen3:30b", "qwen3:8b", "qwen3:14b", "qwen3:32b", "gpt-oss:20b", "deepseek-r1:14b", "gemma3:12b",
  ],
};

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

/** 静态 id 列表转模型项(`:free` 后缀 → free:true,供前端模型 filter 用)。 */
function toEntries(ids: string[]): ModelEntry[] {
  return ids.map((id) => (id.endsWith(":free") ? { id, free: true } : { id }));
}

type ModelsPayload = { data?: { id?: string; pricing?: { prompt?: string | number } }[] };

/** 解析 OpenAI 兼容 /models 响应为模型项(pricing.prompt 为 0 → free:true)。 */
function parseModelEntries(data: ModelsPayload): ModelEntry[] {
  const list = Array.isArray(data?.data) ? data.data : [];
  return list
    .map((m) => m?.id)
    .filter((id): id is string => typeof id === "string" && id.length > 0)
    .slice(0, 300)
    .map((id) => {
      const raw = list.find((m) => m?.id === id);
      const p = raw?.pricing?.prompt;
      return p === "0" || p === 0 ? { id, free: true } : { id };
    });
}

export interface FetchProviderModelsOpts {
  key?: string;
  baseUrl?: string;
  fetchImpl?: FetchLike;
  /** 服务端 KV(读动态下架登记用);缺省则只滤 hardcode seed。 */
  kv?: unknown;
  /** 服务端注入的额外请求头(如 Mac provider 的 Access service token)。 */
  accessHeaders?: Record<string, string>;
}

/** 拉单个 OpenAI 兼容端点的模型项(8s 超时);任何失败(网络/非 2xx/坏 JSON)返回 null。 */
async function fetchEndpointEntries(
  baseURL: string,
  opts: FetchProviderModelsOpts,
): Promise<ModelEntry[] | null> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const headers: Record<string, string> = {};
  if (opts.key?.trim()) headers.Authorization = `Bearer ${opts.key.trim()}`;
  if (opts.accessHeaders) Object.assign(headers, opts.accessHeaders);
  let res: Response;
  try {
    const init: RequestInit & { signal?: AbortSignal } = { headers };
    if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
      init.signal = AbortSignal.timeout(8000);
    }
    res = await fetchImpl(`${baseURL.replace(/\/+$/, "")}/models`, init);
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const data = (await res.json().catch(() => null)) as ModelsPayload | null;
  return data ? parseModelEntries(data) : null;
}

/**
 * mac-llm 列表:只拉 Ollama 一个端点(MLX 已停用,不再有合并)。
 * 成功 → source:"live";失败(或列表为空) → 离线软回落静态 7 个。
 */
async function fetchMacModels(opts: FetchProviderModelsOpts): Promise<ModelsResult> {
  const entries = await fetchEndpointEntries(MODELS_BASE_URL["mac-llm"]!, opts);
  if (!entries || entries.length === 0) {
    return {
      provider: "mac-llm",
      source: "static",
      offline: true,
      models: toEntries(STATIC_MODELS["mac-llm"] ?? []),
    };
  }
  // 下架过滤:登记统一归 mac-llm 名下(见 @numerology/ai 的 deadRegistryName)。
  const dead = opts.kv ? deadModelIds(await readDeadModels(opts.kv), "mac-llm") : new Set<string>();
  const filtered = filterRetired(entries).filter((m) => !dead.has(normDeadModelId(m.id)));
  return { provider: "mac-llm", source: "live", models: filtered.length > 0 ? filtered : entries };
}

/**
 * 拉取某 provider 的模型列表。纯函数(fetch 可注入,便于测试)。
 * - workers-ai:binding 无 list 接口,返回构建时核验表(verified-static)。
 * - OpenAI 兼容:代理 {baseURL}/models;401 → needsKey。
 * - anthropic/custom:静态表(无标准端点)。
 * - mac-llm:单一 Mac provider → 只拉 Ollama 端点(见 fetchMacModels);
 *   显式传 baseUrl 时按单端点走既有流程。
 * - mac-mlx(退役旧名):入口先正规化为 mac-llm,行为与 mac-llm 完全一致。
 * key 只经 Authorization 头发送,绝不出现在返回值/日志中。
 */
export async function fetchProviderModels(
  provider: string,
  opts: FetchProviderModelsOpts = {},
): Promise<ModelsResult> {
  const name = normProviderAlias(provider);
  const fetchImpl = opts.fetchImpl ?? fetch;

  if (name === "workers-ai") {
    return {
      provider: name,
      source: "verified-static",
      verifiedAt: WORKERS_AI_VERIFIED_AT,
      models: WORKERS_AI_MODELS.map((m) => ({ id: m.id })),
    };
  }

  if (name === "anthropic" || name === "custom") {
    return { provider: name, source: "static", models: toEntries(STATIC_MODELS[name] ?? []) };
  }

  if (name === "mac-llm" && !(opts.baseUrl && opts.baseUrl.trim())) {
    return fetchMacModels(opts);
  }

  const baseURL = (opts.baseUrl?.trim() || MODELS_BASE_URL[name] || "").replace(/\/+$/, "");
  if (!baseURL) {
    return { provider: name, source: "static", models: toEntries(STATIC_MODELS[name] ?? []) };
  }

  const headers: Record<string, string> = {};
  if (opts.key?.trim()) headers.Authorization = `Bearer ${opts.key.trim()}`;
  if (opts.accessHeaders) Object.assign(headers, opts.accessHeaders);
  const isMac = isMacProvider(name);
  const offlineFallback = (): ModelsResult => ({
    provider: name,
    source: "static",
    offline: true,
    models: toEntries(STATIC_MODELS[name] ?? []),
  });
  let res: Response;
  try {
    const init: RequestInit & { signal?: AbortSignal } = { headers };
    if (isMac && typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
      init.signal = AbortSignal.timeout(8000);
    }
    res = await fetchImpl(`${baseURL}/models`, init);
  } catch (err) {
    if (isMac) return offlineFallback();
    throw new Error(`模型列表请求失败:${err instanceof Error ? err.message : String(err)}`);
  }
  if (res.status === 401 || res.status === 403) {
    return {
      provider: name,
      source: "static",
      needsKey: true,
      models: toEntries(STATIC_MODELS[name] ?? []),
    };
  }
  if (!res.ok) {
    if (isMac) return offlineFallback();
    throw new Error(`模型列表请求失败(HTTP ${res.status})`);
  }
  const data = (await res.json()) as ModelsPayload;
  const models = parseModelEntries(data);
  // 下架模型直接移除(选了必 404),不让用户选到:hardcode seed + KV 动态登记取并集。
  // 若过滤后为空则回落原列表(避免下拉被清空,属于异常状态)。
  const dead = opts.kv ? deadModelIds(await readDeadModels(opts.kv), name) : new Set<string>();
  const filtered = filterRetired(models).filter(
    (m) => !dead.has(normDeadModelId(m.id)),
  );
  return { provider: name, source: "live", models: filtered.length > 0 ? filtered : models };
}

/** 退役 alias 正规化:mac-mlx(MLX 停用前的旧名) → mac-llm;其它小写去空白原样。 */
function normProviderAlias(provider: string): string {
  const n = provider.trim().toLowerCase();
  return n === "mac-mlx" ? "mac-llm" : n;
}

/** 静态备选表(前端 24h 缓存失效/拉取失败时的回落,也供路由复用)。 */
export function staticModelsFor(provider: string): string[] {
  return STATIC_MODELS[normProviderAlias(provider)] ?? [];
}
