import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import {
  BudgetExceededError,
  checkBudget,
  recordUsage,
  type BudgetKV,
} from "./budget.js";
import { recordDeadModel } from "./deadModels.js";
import { WORKERS_AI_DEFAULT_MODEL } from "./workersAiModels.js";

/**
 * 多 provider 解讀層:排盤永遠本地確定性計算、不花錢;只有 AI 解讀/對話走這裏。
 * 通過 AI_PROVIDER 環境變量切換。默認 workers-ai(Cloudflare Workers AI binding,
 * 免 key,跑在 Cloudflare 自家網絡,每月 $2 硬預算守衛),pollinations 作免 key 備選;
 * 也可用 openrouter(聚合 API,免費 :free 模型,需 key) / glm / gemini / groq / anthropic /
 * ollama(本地) / custom(任意 OpenAI 兼容端點)。
 *
 * 設計:除 Anthropic / workers-ai 外都走 OpenAI 兼容協議(同一段代碼),
 * 靠 baseURL + 模型名區分。
 */

/** system 由若干文本塊組成;cache:true 的塊在 Anthropic 上打 prompt cache,其它 provider 忽略。 */
export interface SystemBlock {
  text: string;
  cache?: boolean;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Usage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  /** Workers AI 直接上報的 neurons(預算記賬用,其它 provider 無)。 */
  neurons?: number;
}

export type ModelKind = "report" | "chat";

export interface CompletionRequest {
  /** report → 選更強模型;chat → 選更快模型 */
  kind: ModelKind;
  system: SystemBlock[];
  messages: ChatMessage[];
  maxTokens: number;
}

/** 按請求覆蓋 provider/key(BYOK):任一缺省則回落到環境變量/默認。 */
export interface ProviderOptions {
  provider?: string;
  apiKey?: string;
  model?: string;
  baseURL?: string;
  /**
   * Workers AI 的服務端 binding(僅服務端注入,絕不來自客戶端請求體,
   * 也絕不序列化給客戶端):{ ai: env.AI, kv: env.AI_BUDGET_KV }。
   */
  aiBinding?: { ai?: unknown; kv?: unknown };
  /**
   * 服務端注入的額外請求頭(僅服務端設置,絕不來自客戶端請求體):
   * 目前唯一用途是 Mac provider(mac-llm;舊名 mac-mlx 會先正規化)的 Cloudflare Access service token
   * (CF-Access-Client-Id/Secret),由 resolveServerAi 從 Pages env 注入。
   */
  extraHeaders?: Record<string, string>;
  /**
   * 用戶自定義的 AI 人設 / 系統提示(可空)。若非空,追加爲 system 的**最後**一塊
   * (在 locale 語言指令之後),優先級最高,用戶可覆蓋默認人設。
   */
  customSystemPrompt?: string;
  /**
   * 捕捉思考過程(僅服務端 route 注入,絕不來自客戶端請求體;預設 off)。
   * 目前只有 report / fortune 兩條 route 開啟;chat 等其它 route 不開,維持壓制。
   * 開啟後:
   * - Mac route 不再送 reasoning_effort:"none",讓模型正常思考;
   * - OpenAI 兼容流的結構化 reasoning delta 與 content 內嵌的 <think>…</think> 段,
   *   統一正規化為文本流中的 <think>…</think> 段,由前端分拆後預設折疊展示。
   * 關閉(預設):reasoning 通道丟棄、content 內嵌 think 段剝除(即原有壓制行為)。
   */
  captureThinking?: boolean;
}

/**
 * 把用戶自定義人設追加爲 system 末塊;爲空/空白則原樣返回。
 * 導出以便測試。
 */
export function applyCustomPrompt(system: SystemBlock[], opts?: ProviderOptions): SystemBlock[] {
  const p = opts?.customSystemPrompt?.trim();
  return p ? [...system, { text: p }] : system;
}

interface ProviderDef {
  kind: "anthropic" | "openai" | "workers-ai";
  label: string;
  /** 依次嘗試的環境變量名,第一個有值的作爲 API key */
  keys: string[];
  baseURL?: string;
  models: Record<ModelKind, string>;
  /** 免費申請地址(報錯時提示用戶) */
  signup?: string;
  /** 是否免費額度 */
  free: boolean;
  /** 本地/無需 API key(如 Ollama):缺 key 不報錯,傳佔位符即可 */
  noKey?: boolean;
}

const PROVIDERS: Record<string, ProviderDef> = {
  "workers-ai": {
    kind: "workers-ai",
    label: "Cloudflare Workers AI(本站直连·免 key·月 $2 上限)",
    keys: [],
    models: { report: WORKERS_AI_DEFAULT_MODEL, chat: WORKERS_AI_DEFAULT_MODEL },
    free: true,
    noKey: true,
  },
  pollinations: {
    kind: "openai",
    label: "Pollinations(免费·免 key·开箱即用)",
    keys: ["POLLINATIONS_TOKEN"],
    baseURL: process.env.POLLINATIONS_BASE_URL || "https://text.pollinations.ai/openai",
    models: { report: "openai", chat: "openai" },
    signup: "https://pollinations.ai/",
    free: true,
    noKey: true,
  },
  ollama: {
    kind: "openai",
    label: "本地 Ollama(免费·无需 key)",
    keys: ["OLLAMA_API_KEY"],
    baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1",
    models: { report: "qwen2.5:32b", chat: "qwen2.5:32b" },
    signup: "https://ollama.com/download",
    free: true,
    noKey: true,
  },
  "mac-llm": {
    kind: "openai",
    label: "Mac LLM(Ollama·免费·headless Mac,无 key)",
    keys: [],
    baseURL: "https://ollama.hectorchan.com/v1",
    models: { report: "qwen3:30b", chat: "qwen3:8b" },
    free: true,
    noKey: true,
  },
  glm: {
    kind: "openai",
    label: "智谱 GLM-4-Flash(免费)",
    keys: ["GLM_API_KEY", "ZHIPU_API_KEY"],
    baseURL: "https://open.bigmodel.cn/api/paas/v4",
    models: { report: "glm-4-flash", chat: "glm-4-flash" },
    signup: "https://open.bigmodel.cn/",
    free: true,
  },
  gemini: {
    kind: "openai",
    label: "Google Gemini 2.0 Flash(免费额度)",
    keys: ["GEMINI_API_KEY", "GOOGLE_API_KEY"],
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    models: { report: "gemini-3.8-flash", chat: "gemini-3.8-flash" },
    signup: "https://aistudio.google.com/apikey",
    free: true,
  },
  groq: {
    kind: "openai",
    label: "Groq Llama-3.3-70B(免费)",
    keys: ["GROQ_API_KEY"],
    baseURL: "https://api.groq.com/openai/v1",
    models: { report: "llama-3.3-70b-versatile", chat: "llama-3.3-70b-versatile" },
    signup: "https://console.groq.com/keys",
    free: true,
  },
  openrouter: {
    kind: "openai",
    label: "OpenRouter(聚合 API,免费 :free 模型)",
    keys: ["OPENROUTER_API_KEY"],
    baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
    models: { report: "google/gemma-4-31b-it:free", chat: "google/gemma-4-26b-a4b-it:free" },
    signup: "https://openrouter.ai/keys",
    free: true,
  },
  anthropic: {
    kind: "anthropic",
    label: "Anthropic Claude(付费)",
    keys: ["ANTHROPIC_API_KEY"],
    models: { report: "claude-opus-4-8", chat: "claude-sonnet-4-6" },
    signup: "https://console.anthropic.com/",
    free: false,
  },
};

/**
 * 屋企 Mac 上的本地 provider:同一部 headless Mac、同一個 Cloudflare Access
 * application + service token,共用 token 注入路徑與即時模型列表行爲。
 * 2026-11-02 起 Mac 只行 Ollama 一個 runtime(MLX 已停用:disable 唔 delete,
 * Mac 上的 LaunchAgent 只是 bootout + plist 改名 .disabled,日後可復活):
 * 32GB RAM 兩邊大模型互搶、MLX 線程死過兩次,而 MLX 的 2 個模型與 Ollama 重複。
 * mac-mlx 是已退役的舊名,只作 alias:所有入口先正規化到 mac-llm(見
 * normalizeProviderName),新 UI 永不產生它;已存設置裏的 mlx-community/* 模型 id
 * 由 web 側 migrateAiSettings 映射到 Ollama 同級模型。
 */
export const MAC_PROVIDER_NAMES = ["mac-llm"] as const;

/** 已退役的舊 provider 名(僅兼容:正規化到 mac-llm,仍按 Mac provider 對待)。 */
export const MAC_PROVIDER_ALIASES = ["mac-mlx"] as const;

/** provider 名正規化:退役 alias mac-mlx → mac-llm;其它原樣(小寫去空白)。 */
export function normalizeProviderName(name: string): string {
  const n = name.trim().toLowerCase();
  return (MAC_PROVIDER_ALIASES as readonly string[]).includes(n) ? "mac-llm" : n;
}

/** 是否爲屋企 Mac 本地 provider(mac-llm,或退役舊名 mac-mlx)。 */
export function isMacProvider(name: string): boolean {
  const n = name.trim().toLowerCase();
  return (
    (MAC_PROVIDER_NAMES as readonly string[]).includes(n) ||
    (MAC_PROVIDER_ALIASES as readonly string[]).includes(n)
  );
}

/** 死模型登記的歸屬名:Mac 統一記到 mac-llm 名下(模型列表按 mac-llm 過濾)。 */
function deadRegistryName(name: string): string {
  return isMacProvider(name) ? "mac-llm" : name;
}

// 默認走 Cloudflare Workers AI binding(免 key,跑在 CF 自家網絡,
// 不受 Pollinations 免費 tier 在邊緣網絡的飄忽影響;每月 $2 硬預算守衛)。
// binding 缺失(本地開發)時 provider 層會給出明確報錯,屆時切其它 provider 即可。
const DEFAULT_PROVIDER = "workers-ai";

/** 當前生效的 provider 名(小寫,退役 alias 已正規化)。opts 可按請求覆蓋(BYOK)。 */
export function activeProviderName(opts?: ProviderOptions): string {
  const name = normalizeProviderName(opts?.provider || process.env.AI_PROVIDER || DEFAULT_PROVIDER);
  if (name !== "custom" && !PROVIDERS[name]) {
    throw new Error(`未知 AI provider="${name}"。可选:${Object.keys(PROVIDERS).join(" / ")} / custom`);
  }
  return name;
}

function resolveDef(name: string, opts?: ProviderOptions): ProviderDef {
  if (name === "custom") {
    const baseURL = opts?.baseURL || process.env.AI_BASE_URL;
    if (!baseURL) throw new Error("custom 需要 baseURL(任意 OpenAI 兼容端点)");
    const model = opts?.model || process.env.AI_MODEL_REPORT || process.env.AI_MODEL_CHAT;
    if (!model) throw new Error("custom 需要模型名(model)");
    return {
      kind: "openai",
      label: `自定义(${baseURL})`,
      keys: ["AI_API_KEY"],
      baseURL,
      models: { report: model, chat: model },
      free: false,
      noKey: !(opts?.apiKey || process.env.AI_API_KEY),
    };
  }
  const def = PROVIDERS[name]!;
  return opts?.baseURL ? { ...def, baseURL: opts.baseURL } : def;
}

function apiKeyFor(def: ProviderDef, opts?: ProviderOptions): string {
  if (opts?.apiKey && opts.apiKey.trim()) return opts.apiKey.trim();
  for (const k of def.keys) {
    const v = process.env[k];
    if (v && v.trim()) return v.trim();
  }
  if (def.noKey) return "not-needed";
  throw new Error(
    `缺少 ${def.label} 的 API key。请在设置里填入,或在 .env 配置 ${def.keys[0]}` +
      (def.signup ? `(申请:${def.signup})` : ""),
  );
}

function modelFor(def: ProviderDef, kind: ModelKind, opts?: ProviderOptions): string {
  if (opts?.model && opts.model.trim()) return opts.model.trim();
  const override = kind === "report" ? process.env.AI_MODEL_REPORT : process.env.AI_MODEL_CHAT;
  return (override && override.trim()) || def.models[kind];
}

/**
 * 動態模型回落(OpenAI 兼容 provider):默認模型可能被 provider 下架
 * (如 gemini-2.0-flash → 404 "no longer available"),硬編碼默認即永久失效。
 * 僅當模型來自"默認"(用戶與環境變量均未顯式指定)時,404 觸發一次實時
 * /models 拉取,取列表首個模型重試一次。顯式指定的模型 404 → 直接拋真實錯誤,
 * 讓用戶去設置裏換(前端模型列表本就是實時拉取的)。
 * 回落結果按 baseURL 緩存 10 分鐘,避免默認已死時每次請求都多兩次上游調用。
 */
const MODEL_NOT_FOUND_RE = /not found|no longer available|does not exist|unknown model/i;
const fallbackCache = new Map<string, { model: string; at: number }>();
const FALLBACK_TTL_MS = 10 * 60 * 1000;

function isModelNotFoundError(err: unknown): boolean {
  const s = (err as { status?: unknown })?.status;
  if (s !== 404) return false;
  const msg = err instanceof Error ? err.message : String(err);
  return MODEL_NOT_FOUND_RE.test(msg);
}

/** 模型是否顯式指定(請求覆蓋或環境變量):顯式指定的不做動態回落。 */
function isModelExplicit(kind: ModelKind, opts?: ProviderOptions): boolean {
  if (opts?.model && opts.model.trim()) return true;
  const override = kind === "report" ? process.env.AI_MODEL_REPORT : process.env.AI_MODEL_CHAT;
  return !!(override && override.trim());
}

function fallbackCacheKey(baseURL?: string): string {
  return (baseURL ?? "").replace(/\/+$/, "");
}

/**
 * 解析本次實際要用的模型:顯式指定 → 直接用;否則看回落緩存,
 * 命中且未過期則直接用上次驗證可用的模型(默認已死時的快速路徑)。
 */
function resolvePreferredModel(def: ProviderDef, kind: ModelKind, opts?: ProviderOptions): string {
  if (isModelExplicit(kind, opts)) return modelFor(def, kind, opts);
  const hit = fallbackCache.get(fallbackCacheKey(def.baseURL));
  if (hit && Date.now() - hit.at < FALLBACK_TTL_MS) return hit.model;
  return modelFor(def, kind, opts);
}

/**
 * 拉取 OpenAI 兼容端點的實時模型 id 列表(失敗拋錯,由調用方決定如何處理)。
 * extraHeaders 爲服務端注入頭(如 Mac 的 Access token):Mac 端點沒有它會被
 * Access 攔下(403),回落拉列表時必須同樣帶上。
 */
async function fetchLiveModelIds(
  baseURL: string,
  apiKey: string,
  extraHeaders?: Record<string, string>,
): Promise<string[]> {
  const res = await fetch(`${baseURL.replace(/\/+$/, "")}/models`, {
    headers: { Authorization: `Bearer ${apiKey}`, ...(extraHeaders ?? {}) },
  });
  if (!res.ok) throw new Error(`模型列表请求失败(HTTP ${res.status})`);
  const data = (await res.json()) as { data?: { id?: string }[] };
  const list = Array.isArray(data.data) ? data.data : [];
  return list
    .map((m) => m?.id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
}

/**
 * 404 回落:清掉可能已失效的緩存,拉實時列表取首個模型記入緩存並返回。
 * baseURL 傳本次失敗請求實際用的端點(即 def.baseURL,已折入用戶覆蓋)。
 * 列表拉取失敗或爲空 → 拋原始 404 錯誤(真實消息透出,供用戶換模型)。
 */
async function fallbackModel(
  baseURL: string | undefined,
  apiKey: string,
  originalErr: unknown,
  extraHeaders?: Record<string, string>,
): Promise<string> {
  const key = fallbackCacheKey(baseURL);
  fallbackCache.delete(key);
  if (!baseURL) throw originalErr;
  let ids: string[];
  try {
    ids = await fetchLiveModelIds(baseURL, apiKey, extraHeaders);
  } catch {
    throw originalErr;
  }
  const first = ids[0];
  if (!first) throw originalErr;
  fallbackCache.set(key, { model: first, at: Date.now() });
  return first;
}

/** 給前端/日誌看的一行摘要,不含任何 key。 */
export function providerSummary(opts?: ProviderOptions): string {
  const name = activeProviderName(opts);
  const def = resolveDef(name, opts);
  return `${name}(${def.label}) · report=${modelFor(def, "report", opts)} · chat=${modelFor(def, "chat", opts)}`;
}

const TIMEOUT = 15 * 60 * 1000;
function makeAnthropic(apiKey: string): Anthropic {
  return new Anthropic({ apiKey, timeout: TIMEOUT, maxRetries: 2 });
}
function makeOpenAI(apiKey: string, baseURL?: string, defaultHeaders?: Record<string, string>): OpenAI {
  return new OpenAI({ apiKey, baseURL, timeout: TIMEOUT, maxRetries: 2, defaultHeaders });
}

/**
 * Mac provider(mac-llm;舊名 mac-mlx 已正規化,共用同一 Access app)的 Cloudflare Access
 * service token headers。
 * 優先用 opts.extraHeaders(web 側 resolveServerAi 從 Pages env 注入,生產環境可靠路徑);
 * 其次讀進程 env(CLI/本地開發用)。其它 provider 一律不帶。
 */
function accessHeadersFor(name: string, opts?: ProviderOptions): Record<string, string> | undefined {
  if (!isMacProvider(name)) return undefined;
  if (opts?.extraHeaders && Object.keys(opts.extraHeaders).length > 0) return opts.extraHeaders;
  const id = process.env.AI_MAC_LLM_ACCESS_CLIENT_ID;
  const secret = process.env.AI_MAC_LLM_ACCESS_CLIENT_SECRET;
  if (id && secret) return { "CF-Access-Client-Id": id, "CF-Access-Client-Secret": secret };
  return undefined;
}

// ── Anthropic 适配 ────────────────────────────────────────────────────────
function toAnthropicSystem(system: SystemBlock[]): Anthropic.TextBlockParam[] {
  return system.map((b) =>
    b.cache
      ? { type: "text", text: b.text, cache_control: { type: "ephemeral" } }
      : { type: "text", text: b.text },
  );
}

function fromAnthropicUsage(u: Anthropic.Usage): Usage {
  return {
    inputTokens: u.input_tokens,
    outputTokens: u.output_tokens,
    cacheCreationTokens: u.cache_creation_input_tokens ?? 0,
    cacheReadTokens: u.cache_read_input_tokens ?? 0,
  };
}

// ── OpenAI 兼容适配 ───────────────────────────────────────────────────────
function toOpenAIMessages(
  system: SystemBlock[],
  messages: ChatMessage[],
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const systemText = system.map((b) => b.text).join("\n\n");
  return [
    { role: "system", content: systemText },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];
}

function fromOpenAIUsage(u: OpenAI.Completions.CompletionUsage | undefined): Usage {
  return {
    inputTokens: u?.prompt_tokens ?? 0,
    outputTokens: u?.completion_tokens ?? 0,
    cacheCreationTokens: 0,
    cacheReadTokens: 0,
  };
}

// ── 統一文本流接口(與 Anthropic MessageStream 的最小子集一致,web 端零改動) ──
export interface TextStream {
  on(event: "text", listener: (delta: string) => void): unknown;
  on(event: "error", listener: (err: unknown) => void): unknown;
  finalMessage(): Promise<unknown>;
  abort(): void;
}

const THINK_OPEN = "<think>";
const THINK_CLOSE = "</think>";
/**
 * gpt-oss harmony 標記:Ollama 自己會拆 channel(走 reasoning 欄),但 mlx-lm
 * 唔 parse——原始標記直入 content(2026-11-02 MLX gpt-oss 覆測實證:
 * analysis 全文 + 標記混喺正文,真答案喺 final channel 尾段)。所以一併正規化:
 * analysis/commentary channel → think 段;final channel → 正文;<|end|> 收尾;
 * <|start|>assistant 頭銜直接丟棄。呢啲係特殊 token 字面,正常文本唔會出現,零誤傷。
 */
const HARMONY_OPENERS = ["<|channel|>analysis<|message|>", "<|channel|>commentary<|message|>"];
const HARMONY_FINAL = "<|channel|>final<|message|>";
const HARMONY_END = "<|end|>";
const HARMONY_START = "<|start|>assistant";
/** 正文模式要攔截的標記(開思考 / 切 final / 丟棄)。 */
const CONTENT_TOKENS = [THINK_OPEN, ...HARMONY_OPENERS, HARMONY_FINAL, HARMONY_END, HARMONY_START];
/** 思考模式要攔截的標記(閉合思考;final 標記一樣閉合,之後係正文)。 */
const THINK_TOKENS = [THINK_CLOSE, HARMONY_END, HARMONY_FINAL];
const ALL_TOKENS = [...CONTENT_TOKENS, THINK_CLOSE];

/** s 的最長後綴同時是 tag 的真前綴的長度(跨 chunk 標籤切分時要保留的尾巴)。 */
function suffixPrefixLen(s: string, tag: string): number {
  const max = Math.min(s.length, tag.length - 1);
  for (let k = max; k > 0; k--) if (tag.startsWith(s.slice(s.length - k))) return k;
  return 0;
}

/** 在 s 入面搵最早出現的任一 token(同位取最長嗰個)。 */
function findToken(s: string, tokens: readonly string[]): { idx: number; token: string } | null {
  let best: { idx: number; token: string } | null = null;
  for (const token of tokens) {
    const idx = s.indexOf(token);
    if (idx < 0) continue;
    if (!best || idx < best.idx || (idx === best.idx && token.length > best.token.length)) {
      best = { idx, token };
    }
  }
  return best;
}

/**
 * 思考正規化器(增量,供流式逐 chunk 餵入):
 * 把「結構化 reasoning delta」、「content 內嵌 <think>…</think> 段」與
 * 「gpt-oss harmony 原始 channel 標記」統一成文本流中的 <think>…</think> 段
 * ——傳輸協議維持純文字不變,前端用 splitThinking 分拆。
 * - capture=true:思考原樣保留(以標籤包住);reasoning 開的 think 塊在第一段 content
 *   到達時自動閉合;finish() 會補上未閉合的 </think>,保證落檔文本形狀完整。
 * - capture=false(預設/壓制):reasoning 丟棄,思考段整段剝除,
 *   其餘文本逐字不變(無標籤文本零影響)。
 * 標記可跨 chunk 切分:掃描時保留可能是標記前綴的尾巴,不漏不重;
 * finish() 會丟棄流尾未成形的標記碎片。
 */
export class ThinkStreamNormalizer {
  private insideThink = false;
  private thinkFromReasoning = false;
  private held = "";

  constructor(private readonly capture: boolean) {}

  /** 結構化 reasoning delta(Ollama/MLX 的 delta.reasoning)。壓制模式直接丟棄。 */
  pushReasoning(delta: string): string {
    if (!delta || !this.capture) return "";
    let out = "";
    if (!this.insideThink) {
      out += THINK_OPEN;
      this.insideThink = true;
      this.thinkFromReasoning = true;
    }
    return out + delta;
  }

  /** 按目前模式(思考/正文)沖出 held;final=true 時連尾巴碎片都清埋。 */
  private drain(final: boolean): string {
    let out = "";
    for (;;) {
      const hit = findToken(this.held, this.insideThink ? THINK_TOKENS : CONTENT_TOKENS);
      if (!hit) {
        const keep = ALL_TOKENS.reduce((m, t) => Math.max(m, suffixPrefixLen(this.held, t)), 0);
        const emitLen = this.held.length - keep;
        if (!this.insideThink || this.capture) out += this.held.slice(0, emitLen);
        this.held = this.held.slice(emitLen);
        // final:淨返嘅 held 只可能係未成形標記碎片 → 丟棄,唔好漏入正文。
        if (final) this.held = "";
        break;
      }
      const seg = this.held.slice(0, hit.idx);
      if (!this.insideThink || this.capture) out += seg;
      this.held = this.held.slice(hit.idx + hit.token.length);
      if (hit.token === THINK_OPEN || HARMONY_OPENERS.includes(hit.token)) {
        this.insideThink = true;
        this.thinkFromReasoning = false;
        if (this.capture) out += THINK_OPEN;
      } else if (hit.token === HARMONY_START) {
        // 頭銜標記:直接丟棄,模式不變。
      } else {
        // THINK_CLOSE / HARMONY_END / HARMONY_FINAL:閉合思考(final 之後即正文)。
        if (this.insideThink) {
          this.insideThink = false;
          if (this.capture) out += THINK_CLOSE;
        }
      }
    }
    return out;
  }

  /** content delta:掃描內嵌標籤,思考段按 capture 保留或剝除。 */
  pushContent(delta: string): string {
    if (!delta) return "";
    let out = "";
    // reasoning 開的 think 塊:正文一到就先閉合,之後按普通 content 掃描。
    if (this.insideThink && this.thinkFromReasoning) {
      out += THINK_CLOSE;
      this.insideThink = false;
      this.thinkFromReasoning = false;
    }
    this.held += delta;
    return out + this.drain(false);
  }

  /** 流結束:沖出保留尾巴;未閉合的 think 在 capture 模式補 </think>。 */
  finish(): string {
    let out = this.drain(true);
    if (this.insideThink && this.capture) out += THINK_CLOSE;
    this.insideThink = false;
    this.thinkFromReasoning = false;
    this.held = "";
    return out;
  }
}

/** 非流式版正規化(供 chatComplete):reasoning 欄 + content 一併處理,語意與流式版一致。 */
export function normalizeThinkText(content: string, reasoning: string | undefined, capture: boolean): string {
  const n = new ThinkStreamNormalizer(capture);
  return n.pushReasoning(reasoning ?? "") + n.pushContent(content) + n.finish();
}

/** OpenAI 兼容補全結果的 message 附加欄(Ollama/MLX 的結構化 reasoning,不在 SDK 類型內)。 */
function messageReasoning(res: OpenAI.Chat.Completions.ChatCompletion): string | undefined {
  const m = res.choices?.[0]?.message as { reasoning?: unknown; reasoning_content?: unknown } | undefined;
  const v = m?.reasoning ?? m?.reasoning_content;
  return typeof v === "string" && v ? v : undefined;
}

type OpenAIChunkStream = AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;

/** 把 OpenAI 兼容的流式響應包成 Anthropic 風格的事件流。懶啓動:首次 finalMessage() 才真正請求。 */
class OpenAITextStream implements TextStream {
  private textListeners: ((d: string) => void)[] = [];
  private errorListeners: ((e: unknown) => void)[] = [];
  private buffered: string[] = [];
  private fullText = "";
  private done: Promise<{ text: string }> | null = null;
  private aborter = new AbortController();

  private readonly normalizer: ThinkStreamNormalizer;

  constructor(
    private readonly open: (signal: AbortSignal) => Promise<OpenAIChunkStream>,
    captureThinking = false,
  ) {
    this.normalizer = new ThinkStreamNormalizer(captureThinking);
  }

  on(event: "text" | "error", listener: (arg: never) => void): this {
    if (event === "text") {
      this.textListeners.push(listener as (d: string) => void);
      if (this.buffered.length) {
        for (const b of this.buffered) (listener as (d: string) => void)(b);
        this.buffered = [];
      }
    } else {
      this.errorListeners.push(listener as (e: unknown) => void);
    }
    return this;
  }

  private emitText(delta: string): void {
    this.fullText += delta;
    if (this.textListeners.length === 0) {
      this.buffered.push(delta);
    } else {
      for (const l of this.textListeners) l(delta);
    }
  }

  finalMessage(): Promise<{ text: string }> {
    if (!this.done) this.done = this.run();
    return this.done;
  }

  private async run(): Promise<{ text: string }> {
    try {
      const stream = await this.open(this.aborter.signal);
      for await (const chunk of stream) {
        const d = chunk.choices?.[0]?.delta as
          | { content?: string; reasoning?: string; reasoning_content?: string }
          | undefined;
        if (!d) continue;
        // 結構化 reasoning 先行(時間上先於正文),再到 content;兩者經正規化器合流。
        const out =
          this.normalizer.pushReasoning(d.reasoning ?? d.reasoning_content ?? "") +
          this.normalizer.pushContent(d.content ?? "");
        if (out) this.emitText(out);
      }
      const tail = this.normalizer.finish();
      if (tail) this.emitText(tail);
      return { text: this.fullText };
    } catch (err) {
      for (const l of this.errorListeners) l(err);
      throw err;
    }
  }

  abort(): void {
    this.aborter.abort();
  }
}

/**
 * 非流式補全包成 TextStream(給 SSE 掛起的 provider 用,如 Gemini OpenAI 兼容層)。
 * 懶啓動:首次 finalMessage() 才真正請求;全文一次性 emit,接口與流式一致。
 */
class CompleteTextStream implements TextStream {
  private textListeners: ((d: string) => void)[] = [];
  private errorListeners: ((e: unknown) => void)[] = [];
  private done: Promise<{ text: string }> | null = null;

  constructor(private readonly complete: () => Promise<string>) {}

  on(event: "text" | "error", listener: (arg: never) => void): this {
    if (event === "text") this.textListeners.push(listener as (d: string) => void);
    else this.errorListeners.push(listener as (e: unknown) => void);
    return this;
  }

  finalMessage(): Promise<{ text: string }> {
    if (!this.done) this.done = this.run();
    return this.done;
  }

  private async run(): Promise<{ text: string }> {
    try {
      const text = await this.complete();
      for (const l of this.textListeners) l(text);
      return { text };
    } catch (err) {
      for (const l of this.errorListeners) l(err);
      throw err;
    }
  }

  abort(): void {
    // 非流式請求無可中斷的流,best-effort:已發出的請求完成後會被忽略。
  }
}

// ── Workers AI(binding)适配 ───────────────────────────────────────────────

/**
 * 解碼參數 baseline(2026-10-23 research-backed):
 * temperature 0.7 / top_p 0.9 / repetition_penalty 1.1。
 * 研究結論:低 temperature 反而是重複 loop 的元兇(小模型更脆弱);aggressive penalty
 * 疊加會讓輸出更 erratic。env 可覆蓋,方便一次只改一個變量做 A/B:
 * AI_TEMPERATURE / AI_TOP_P / AI_REPETITION_PENALTY。
 */
function numEnv(key: string, def: number): number {
  const v = Number(process.env[key]);
  return Number.isFinite(v) ? v : def;
}
export const DECODE_DEFAULTS = { temperature: 0.7, top_p: 0.9, repetition_penalty: 1.1 } as const;
export function workersAiDecodeParams(): {
  temperature: number;
  top_p: number;
  repetition_penalty: number;
} {
  return {
    temperature: numEnv("AI_TEMPERATURE", DECODE_DEFAULTS.temperature),
    top_p: numEnv("AI_TOP_P", DECODE_DEFAULTS.top_p),
    repetition_penalty: numEnv("AI_REPETITION_PENALTY", DECODE_DEFAULTS.repetition_penalty),
  };
}
/** OpenAI 兼容 / Anthropic 路徑:只用通用參數(penalty 各家語義不一,不碰)。 */
function baseDecodeParams(): { temperature: number; top_p: number } {
  return {
    temperature: numEnv("AI_TEMPERATURE", DECODE_DEFAULTS.temperature),
    top_p: numEnv("AI_TOP_P", DECODE_DEFAULTS.top_p),
  };
}

/**
 * Mac Ollama 端點專用參數:Ollama 上的 qwen3/deepseek 系默認先輸出思考鏈,
 * 會喫掉 maxTokens 導致正文爲空(實測 max_tokens=120 全被思考佔滿)。
 * reasoning_effort:"none" 關掉思考,正文直接出、更快——但思考被壓制時,個別模型
 * 會把規劃寫進 content 做正文獨白(2026-11-02 截圖實證,qwen3:30b)。
 * 故 captureThinking 開啓時(僅 report/fortune route)不送此參數:讓模型正常思考,
 * 思考走獨立 reasoning 通道,由 ThinkStreamNormalizer 正規化後前端摺疊展示。
 * Mac 自 MLX 停用後只剩 Ollama 一個 runtime,故凡 Mac provider 都送(舊名 mac-mlx
 * 已在 activeProviderName 正規化爲 mac-llm,待遇一致)。
 * 注意:Ollama 實測接受 "none",但當前 OpenAI SDK 的 ReasoningEffort 未含它,故 cast;
 * 運行時序列化值仍爲 "none",Ollama 認。
 */
function macRouteParams(
  name: string,
  captureThinking = false,
): { reasoning_effort?: OpenAI.ReasoningEffort } {
  if (captureThinking) return {};
  return isMacProvider(name)
    ? { reasoning_effort: "none" as unknown as OpenAI.ReasoningEffort }
    : {};
}

/** env.AI binding 的最小接口(實際爲 Cloudflare 的 Ai binding)。 */
interface AiBindingLike {
  run(model: string, input: Record<string, unknown>): Promise<unknown>;
}

/** 從 ProviderOptions 取出服務端注入的 binding;缺失則給明確報錯(絕不靜默)。 */
function workersAiRuntime(opts?: ProviderOptions): { ai: AiBindingLike; kv: BudgetKV } {
  const ai = opts?.aiBinding?.ai as AiBindingLike | undefined;
  if (!ai || typeof ai.run !== "function") {
    throw new Error(
      "Workers AI binding 未配置:请在 Cloudflare Pages 的 Settings > Bindings 中添加 " +
        "AI binding(变量名 AI)。本地开发可用 `wrangler pages dev`,或在 AI 设置中切换其它 provider",
    );
  }
  const kv = opts?.aiBinding?.kv as BudgetKV | undefined;
  if (!kv || typeof kv.get !== "function" || typeof kv.put !== "function") {
    throw new Error(
      "AI_BUDGET_KV 未配置:预算守卫要求 KV binding(变量名 AI_BUDGET_KV)," +
        "请在 Cloudflare Pages 的 Settings > Bindings 中添加",
    );
  }
  return { ai, kv };
}

interface WorkersAiSseUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  neurons?: number;
}

/**
 * 把 Workers AI binding 的 SSE 流(`data: {"response":"..."}` … `data: [DONE]`)
 * 包成統一的 TextStream。懶啓動:首次 finalMessage() 才真正請求,
 * 預算檢查放在 run() 首行——首 token 前超支會直接拋 BudgetExceededError,
 * 經 streamToPrimedResponse 預熱後表現爲乾淨的 JSON 429,而非截斷流。
 */
class WorkersAITextStream implements TextStream {
  private textListeners: ((d: string) => void)[] = [];
  private errorListeners: ((e: unknown) => void)[] = [];
  private fullText = "";
  private neurons = 0;
  private done: Promise<{ text: string; neurons: number }> | null = null;

  constructor(
    private readonly args: {
      binding: AiBindingLike;
      kv: BudgetKV;
      model: string;
      system: SystemBlock[];
      messages: ChatMessage[];
      maxTokens: number;
    },
  ) {}

  on(event: "text" | "error", listener: (arg: never) => void): this {
    if (event === "text") this.textListeners.push(listener as (d: string) => void);
    else this.errorListeners.push(listener as (e: unknown) => void);
    return this;
  }

  private emitText(delta: string): void {
    this.fullText += delta;
    for (const l of this.textListeners) l(delta);
  }

  private emitError(err: unknown): void {
    for (const l of this.errorListeners) l(err);
  }

  finalMessage(): Promise<{ text: string; neurons: number }> {
    if (!this.done) this.done = this.run();
    return this.done;
  }

  private async run(): Promise<{ text: string; neurons: number }> {
    const { binding, kv, model, system, messages, maxTokens } = this.args;
    try {
      // 預算前置檢查:超支直接拋,預熱層會轉成 JSON 429。
      await checkBudget(kv);
      const fullMessages = toWorkersAiMessages(system, messages);
      const stream = (await binding.run(model, {
        messages: fullMessages,
        max_tokens: maxTokens,
        stream: true,
        ...workersAiDecodeParams(),
      })) as ReadableStream<Uint8Array>;
      await this.pump(stream);
      await recordUsage(kv, this.neurons);
      return { text: this.fullText, neurons: this.neurons };
    } catch (err) {
      this.emitError(err);
      throw err;
    }
  }

  /** 消費 SSE 流:拼 response 文本,取最後一個帶 usage 的事件的 neurons(即總量)。 */
  private async pump(stream: ReadableStream<Uint8Array>): Promise<void> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf("\n\n")) >= 0) {
        const block = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        this.handleBlock(block);
      }
    }
    const tail = buf.trim();
    if (tail) this.handleBlock(tail);
  }

  private handleBlock(block: string): void {
    for (const line of block.split("\n")) {
      const t = line.trim();
      if (!t.startsWith("data:")) continue;
      const payload = t.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      let obj: { response?: unknown; usage?: WorkersAiSseUsage };
      try {
        obj = JSON.parse(payload) as { response?: unknown; usage?: WorkersAiSseUsage };
      } catch {
        continue; // 極少數情況下的殘缺塊,跳過(文本已在前塊發出)
      }
      if (typeof obj.response === "string" && obj.response) this.emitText(obj.response);
      const n = obj.usage?.neurons;
      if (typeof n === "number" && Number.isFinite(n) && n >= 0) this.neurons = n;
    }
  }

  abort(): void {
    // binding 流無外部 abort 語義;調用方(預熱/取消)不再消費即等價終止。
  }
}

// ── 對外統一入口 ──────────────────────────────────────────────────────────

/** 非流式補全。opts 可傳 BYOK(用戶自帶 provider/key)。 */
export async function chatComplete(
  req: CompletionRequest,
  opts?: ProviderOptions,
): Promise<{ text: string; usage: Usage }> {
  const name = activeProviderName(opts);
  const def = resolveDef(name, opts);
  // 用戶自定義人設追加爲 system 末塊(語言指令之後),優先級最高。
  const system = applyCustomPrompt(req.system, opts);
  if (def.kind === "workers-ai") {
    const { ai, kv } = workersAiRuntime(opts);
    const model = modelFor(def, req.kind, opts);
    await checkBudget(kv);
    const res = (await ai.run(model, {
      messages: toWorkersAiMessages(system, req.messages),
      max_tokens: req.maxTokens,
      ...workersAiDecodeParams(),
    })) as { response?: unknown; usage?: WorkersAiSseUsage };
    const text = typeof res.response === "string" ? res.response : "";
    const neurons = typeof res.usage?.neurons === "number" ? res.usage.neurons : 0;
    await recordUsage(kv, neurons);
    return {
      text,
      usage: {
        inputTokens: res.usage?.prompt_tokens ?? 0,
        outputTokens: res.usage?.completion_tokens ?? 0,
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
        neurons,
      },
    };
  }
  const apiKey = apiKeyFor(def, opts);
  if (def.kind === "anthropic") {
    const res = await makeAnthropic(apiKey).messages.create({
      model: modelFor(def, req.kind, opts),
      max_tokens: req.maxTokens,
      ...baseDecodeParams(),
      system: toAnthropicSystem(system),
      messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
    });
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    return { text, usage: fromAnthropicUsage(res.usage) };
  }
  const accessHeaders = accessHeadersFor(name, opts);
  const messages = toOpenAIMessages(system, req.messages);
  const preferred = resolvePreferredModel(def, req.kind, opts);
  const capture = opts?.captureThinking ?? false;
  const complete = (model: string) =>
    makeOpenAI(apiKey, def.baseURL, accessHeaders).chat.completions.create({
      model,
      max_tokens: req.maxTokens,
      ...baseDecodeParams(),
      ...macRouteParams(name, capture),
      messages,
    });
  const resultOf = (res: OpenAI.Chat.Completions.ChatCompletion) => ({
    text: normalizeThinkText(res.choices?.[0]?.message?.content ?? "", messageReasoning(res), capture),
    usage: fromOpenAIUsage(res.usage),
  });
  try {
    const res = await complete(preferred);
    return resultOf(res);
  } catch (err) {
    // 默認模型被下架(404) → 動態回落到實時列表首個模型重試一次;
    // 顯式指定的模型 404 → 直接拋真實錯誤(用戶去設置裏換)。
    // 無論哪種,先把下架模型記入 KV:下次拉模型列表時自動濾走(動態下架)。
    // Mac 登記統一歸 mac-llm 名下(列表按 mac-llm 過濾,見 deadRegistryName)。
    if (isModelNotFoundError(err)) await recordDeadModel(opts?.aiBinding?.kv, deadRegistryName(name), preferred);
    if (!isModelNotFoundError(err) || isModelExplicit(req.kind, opts)) throw err;
    const res = await complete(
      await fallbackModel(def.baseURL, apiKey, err, accessHeaders),
    );
    return resultOf(res);
  }
}

/** 流式補全。opts 可傳 BYOK。返回 Anthropic 風格事件流,供 web 端逐字渲染。 */
export function chatStream(req: CompletionRequest, opts?: ProviderOptions): TextStream {
  const name = activeProviderName(opts);
  const def = resolveDef(name, opts);
  // 用戶自定義人設追加爲 system 末塊(語言指令之後),優先級最高。
  const system = applyCustomPrompt(req.system, opts);
  if (def.kind === "workers-ai") {
    const { ai, kv } = workersAiRuntime(opts);
    return new WorkersAITextStream({
      binding: ai,
      kv,
      model: modelFor(def, req.kind, opts),
      system,
      messages: req.messages,
      maxTokens: req.maxTokens,
    });
  }
  const apiKey = apiKeyFor(def, opts);
  if (def.kind === "anthropic") {
    return makeAnthropic(apiKey).messages.stream({
      model: modelFor(def, req.kind, opts),
      max_tokens: req.maxTokens,
      ...baseDecodeParams(),
      system: toAnthropicSystem(system),
      messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
    }) as unknown as TextStream;
  }
  if (name === "gemini") {
    // Gemini OpenAI 兼容層的 SSE 流式會掛起(2026-10-23 實測:60s 無首字節,三次復現;
    // 非流式同一 endpoint 同一 key 正常 200)。改走非流式再包成 TextStream,文本一次性 emit。
    return new CompleteTextStream(async () => (await chatComplete(req, opts)).text);
  }
  const accessHeaders = accessHeadersFor(name, opts);
  const messages = toOpenAIMessages(system, req.messages);
  const preferred = resolvePreferredModel(def, req.kind, opts);
  const explicit = isModelExplicit(req.kind, opts);
  const capture = opts?.captureThinking ?? false;
  return new OpenAITextStream(async (signal) => {
    const open = (model: string) =>
      makeOpenAI(apiKey, def.baseURL, accessHeaders).chat.completions.create(
        { model, max_tokens: req.maxTokens, stream: true, ...baseDecodeParams(), ...macRouteParams(name, capture), messages },
        { signal },
      );
    try {
      return await open(preferred);
    } catch (err) {
      // 默認模型被下架(404) → 動態回落到實時列表首個模型重試一次(懶啓動內);
      // 顯式指定的模型 404 → 直接拋真實錯誤。
      // 無論哪種,先把下架模型記入 KV:下次拉模型列表時自動濾走(動態下架)。
      if (isModelNotFoundError(err)) await recordDeadModel(opts?.aiBinding?.kv, deadRegistryName(name), preferred);
      if (!isModelNotFoundError(err) || explicit) throw err;
      return open(await fallbackModel(def.baseURL, apiKey, err, accessHeaders));
    }
  }, capture);
}

/**
 * 語言指令提升:實測 Llama 3.1 8B 對 system 末尾的語言指令遵循不穩(仍出簡體),
 * 但放在 user 消息開頭則穩定輸出繁體。故 workers-ai 路徑下,把語言指令塊
 * 同時前置到第一條 user 消息(原 system 塊保留,雙保險)。
 */
const LOCALE_DIRECTIVE_RE = /輸出語言|输出语言|Output language/;

function promoteLocaleDirective(
  system: SystemBlock[],
  messages: ChatMessage[],
): { systemText: string; messages: { role: string; content: string }[] } {
  const dirBlock = system.find((b) => LOCALE_DIRECTIVE_RE.test(b.text));
  const systemText = system.map((b) => b.text).join("\n\n");
  const mapped = messages.map((m, i) => ({
    role: m.role,
    content: i === 0 && dirBlock ? `${dirBlock.text}\n\n${m.content}` : m.content,
  }));
  return { systemText, messages: mapped };
}

/** Workers AI 的消息形態:system 單獨成塊(與 OpenAI 兼容層把 system 拼進文本不同)。 */
function toWorkersAiMessages(
  system: SystemBlock[],
  messages: ChatMessage[],
): { role: string; content: string }[] {
  const { systemText, messages: msgs } = promoteLocaleDirective(system, messages);
  return [...(systemText.trim() ? [{ role: "system", content: systemText }] : []), ...msgs];
}

/** 給 /api/models 用的 provider 元信息(分組/是否需 key/申請地址),workers-ai 排首位。 */
export type ProviderGroup = "nokey" | "freekey" | "paid";

export interface ProviderMeta {
  name: string;
  labelKey: string;
  group: ProviderGroup;
  needsKey: boolean;
  signup?: string;
}

export function listProviders(): ProviderMeta[] {
  return [
    { name: "workers-ai", labelKey: "settings.prov.workersai", group: "nokey", needsKey: false },
    { name: "pollinations", labelKey: "settings.prov.pollinations", group: "nokey", needsKey: false, signup: "https://pollinations.ai/" },
    { name: "mac-llm", labelKey: "settings.prov.macllm", group: "nokey", needsKey: false },
    { name: "glm", labelKey: "settings.prov.glm", group: "freekey", needsKey: true, signup: "https://open.bigmodel.cn/" },
    { name: "gemini", labelKey: "settings.prov.gemini", group: "freekey", needsKey: true, signup: "https://aistudio.google.com/apikey" },
    { name: "groq", labelKey: "settings.prov.groq", group: "freekey", needsKey: true, signup: "https://console.groq.com/keys" },
    { name: "openrouter", labelKey: "settings.prov.openrouter", group: "freekey", needsKey: true, signup: "https://openrouter.ai/keys" },
    { name: "anthropic", labelKey: "settings.prov.anthropic", group: "paid", needsKey: true, signup: "https://console.anthropic.com/" },
    { name: "custom", labelKey: "settings.prov.custom", group: "paid", needsKey: true },
  ];
}

/** 給 /api/models 用的 baseURL 查詢(anthropic/custom 無標準 /models 端點 → undefined)。退役 alias 先正規化。 */
export function providerBaseUrl(name: string): string | undefined {
  const def = PROVIDERS[normalizeProviderName(name)];
  if (!def || def.kind !== "openai") return undefined;
  return def.baseURL;
}

/** 該 provider 的 /models 是否需要 key(按註冊表判斷)。退役 alias 先正規化。 */
export function providerNeedsKey(name: string): boolean {
  const n = normalizeProviderName(name);
  if (n === "custom") return true;
  const def = PROVIDERS[n];
  if (!def) return true;
  return !def.noKey;
}
