import type { TKey } from "./i18n.js";

/**
 * 設置面板用的 provider 元信息(客戶端安全:不含任何 SDK)。
 * 與 packages/ai/src/provider.ts 的 listProviders() 保持一致(同名同序);
 * provider 增減時兩處同步改。
 */
export type ProviderGroup = "nokey" | "freekey" | "paid";

/** 費用檔:free=完全免費, freetier=免費額度, paid=付費。 */
export type ProviderCost = "free" | "freetier" | "paid";

export interface ProviderMeta {
  name: string;
  /** tab 短名(僅短名,不塞描述)。 */
  shortKey: TKey;
  /** 選中後屬性面板裡的一行短注。 */
  noteKey: TKey;
  group: ProviderGroup;
  cost: ProviderCost;
  needsKey: boolean;
  /** key 選填(如 Pollinations:匿名可用,填 key 更穩)。 */
  optionalKey?: boolean;
  signup?: string;
}

/** 頂部 filter chips:全部 / 免 key / 免費 / 付費。免費=免 key ∪ 免費額度。 */
export type ProviderFilter = "all" | "nokey" | "free" | "paid" | "recommended";

export const FILTER_LABEL_KEYS: Record<ProviderFilter, TKey> = {
  all: "settings.filter.all",
  nokey: "settings.filter.nokey",
  free: "settings.filter.free",
  paid: "settings.filter.paid",
  recommended: "settings.filter.recommended",
};

export const COST_LABEL_KEYS: Record<ProviderCost, TKey> = {
  free: "settings.prop.cost.free",
  freetier: "settings.prop.cost.freetier",
  paid: "settings.prop.cost.paid",
};

export const PROVIDER_META: ProviderMeta[] = [
  { name: "workers-ai", shortKey: "settings.tab.workersai", noteKey: "settings.note.workersai", group: "nokey", cost: "free", needsKey: false },
  { name: "pollinations", shortKey: "settings.tab.pollinations", noteKey: "settings.note.pollinations", group: "nokey", cost: "free", needsKey: false, optionalKey: true, signup: "https://pollinations.ai/" },
  { name: "mac-llm", shortKey: "settings.tab.macllm", noteKey: "settings.note.macllm", group: "nokey", cost: "free", needsKey: false },
  { name: "glm", shortKey: "settings.tab.glm", noteKey: "settings.note.glm", group: "freekey", cost: "freetier", needsKey: true, signup: "https://open.bigmodel.cn/" },
  { name: "gemini", shortKey: "settings.tab.gemini", noteKey: "settings.note.gemini", group: "freekey", cost: "freetier", needsKey: true, signup: "https://aistudio.google.com/apikey" },
  { name: "groq", shortKey: "settings.tab.groq", noteKey: "settings.note.groq", group: "freekey", cost: "freetier", needsKey: true, signup: "https://console.groq.com/keys" },
  { name: "openrouter", shortKey: "settings.tab.openrouter", noteKey: "settings.note.openrouter", group: "freekey", cost: "freetier", needsKey: true, signup: "https://openrouter.ai/keys" },
  { name: "anthropic", shortKey: "settings.tab.anthropic", noteKey: "settings.note.anthropic", group: "paid", cost: "paid", needsKey: true, signup: "https://console.anthropic.com/" },
  { name: "custom", shortKey: "settings.tab.custom", noteKey: "settings.note.custom", group: "paid", cost: "paid", needsKey: true },
];

/**
 * 屋企 Mac 本地 provider 集合:同一部 headless Mac、同一個 Cloudflare Access app,
 * 共用即時模型列表 / 離線軟回落 / 60s 緩存行為(與 @numerology/ai 的同名集合保持一致,
 * 兩處增減時同步改)。
 * Mac 只行 Ollama 一個 runtime(MLX 2026-11-02 停用);mac-mlx 是已退役的舊名,
 * 只作 alias 保留 Mac 待遇並在各入口正規化到 mac-llm,新 UI 永不產生它
 * (舊設置載入時由 aiSettings 遷移映射,連同 mlx-community/* 模型 id 一併救濟)。
 */
export const MAC_PROVIDER_NAMES = ["mac-llm"] as const;

/** 已退役的舊 provider 名(僅兼容:舊名入到嚟仍按 Mac provider 對待)。 */
export const MAC_PROVIDER_ALIASES = ["mac-mlx"] as const;

/** 是否為屋企 Mac 本地 provider(mac-llm,或退役舊名 mac-mlx)。 */
export function isMacProvider(name: string): boolean {
  const n = name.trim().toLowerCase();
  return (
    (MAC_PROVIDER_NAMES as readonly string[]).includes(n) ||
    (MAC_PROVIDER_ALIASES as readonly string[]).includes(n)
  );
}

export function filterProviders(filter: ProviderFilter): ProviderMeta[] {
  switch (filter) {
    case "nokey":
      return PROVIDER_META.filter((p) => p.group === "nokey");
    case "free":
      return PROVIDER_META.filter((p) => p.group !== "paid");
    case "paid":
      return PROVIDER_META.filter((p) => p.group === "paid");
    default:
      return PROVIDER_META;
  }
}

/** 帶 free 標記的模型(與 SettingsPanel 的 ModelOption / models.ts 的 ModelEntry 同形)。 */
export interface FreeFlaggedModel {
  id: string;
  free?: boolean;
}

/**
 * 模型級 filter:頂部的 全部/免 key/免費/付費 同時作用於模型下拉。
 * 免費/付費是模型層級屬性(OpenRouter 一個 provider 內同時有 :free 和付費模型),
 * 只 filter provider tabs 會漏掉(見截圖:filter=免費卻選中了付費 model)。
 * - free: 只留 free===true;若列表沒有任何 free 信息(靜態表無標記)則回落為不過濾,
 *   避免把下拉清空。
 * - paid: 踢掉 free===true(未知視為候選);無信息時自然全留。
 * - all/nokey: 不過濾模型(免 key 已在 provider 層過濾)。
 * 結果為空時回落為全列表,保證下拉永遠有可選項。
 */
export function filterModels<T extends FreeFlaggedModel>(
  models: T[],
  filter: ProviderFilter,
  provider?: string,
): T[] {
  if (filter === "recommended") return provider ? filterRecommended(models, provider) : models;
  if (filter !== "free" && filter !== "paid") return models;
  const filtered =
    filter === "free" ? models.filter((m) => m.free === true) : models.filter((m) => m.free !== true);
  return filtered.length > 0 ? filtered : models;
}

/** 靜態 id 列表轉帶 free 標記的模型項(`:free` 後綴 → free:true)。 */
export function staticModelEntries(ids: string[]): FreeFlaggedModel[] {
  return ids.map((id) => (id.endsWith(":free") ? { id, free: true } : { id }));
}

/**
 * 推薦模型(2026-10-23 用 Hector 的 key 實測驗證過可用):
 * - gemini: gemini-3.8-flash(舊 2.0 已被 Google 下架)
 * - openrouter: 三個 :free 模型(實測 200;注意免費額度是按 key 按天限的,超限會 429)
 * - anthropic: 兩個有效 id(該 key 需先充值,餘額為 0)
 * 推薦只做減法:filter 芯片「推薦」把模型下拉過濾到這個表。
 */
export const RECOMMENDED_MODELS: Record<string, string[]> = {
  gemini: ["gemini-3.8-flash"],
  "mac-llm": ["qwen3:30b", "qwen3:8b"],
  openrouter: [
    "google/gemma-4-31b-it:free",
    "google/gemma-4-26b-a4b-it:free",
    "nvidia/nemotron-3.5-lightning:free",
  ],
  anthropic: ["claude-sonnet-4-6", "claude-opus-4-8"],
};

/** 該 provider 下此模型是否在推薦表裡。 */
export function isRecommended(provider: string, id: string): boolean {
  return (RECOMMENDED_MODELS[provider] ?? []).includes(normModelId(id));
}

/** 模型列表只留推薦(結果為空時回落為全列表,保證下拉永遠有可選項)。 */
export function filterRecommended<T extends { id: string }>(models: T[], provider: string): T[] {
  const rec = RECOMMENDED_MODELS[provider];
  if (!rec || rec.length === 0) return models;
  const filtered = models.filter((m) => rec.includes(normModelId(m.id)));
  return filtered.length > 0 ? filtered : models;
}

/**
 * 規範化模型 id:Gemini 實時列表返回 `models/gemini-3.8-flash` 形式,
 * 與推薦表裡的裸 id 對齊(兩種形式發請求都有效,見 provider.ts)。
 */
export function normModelId(id: string): string {
  return id.startsWith("models/") ? id.slice("models/".length) : id;
}

/**
 * 已下架模型(實測 404,選中必失敗):從列表裡直接移除,不讓用戶選到。
 * - gemini-2.0-flash: Google 已下架("no longer available")
 * - gemini-2.5-flash: 新用戶不可用("no longer available to new users")
 * 用裸 id 存,比對經 normModelId 對齊 `models/` 前綴形式。
 */
export const RETIRED_MODEL_IDS: string[] = ["gemini-2.0-flash", "gemini-2.5-flash"];

/** 濾掉已下架模型(空結果則回落原列表,避免下拉被清空)。 */
export function filterRetired<T extends { id: string }>(models: T[]): T[] {
  const filtered = models.filter((m) => !RETIRED_MODEL_IDS.includes(normModelId(m.id)));
  return filtered.length > 0 ? filtered : models;
}

/** 靜態模型備選(動態拉取失敗/未緩存時的回落;workers-ai 用核驗表,見 models.ts)。 */
export const STATIC_MODELS: Record<string, string[]> = {
  "workers-ai": [
    "@cf/mistralai/mistral-small-3.1-24b-instruct",
  ],
  pollinations: ["openai"],
  // Mac 只行 Ollama(MLX 已停用):靜態表就是 Ollama 的 7 個(與服務端一致)。
  "mac-llm": [
    "qwen3:30b", "qwen3:8b", "qwen3:14b", "qwen3:32b", "gpt-oss:20b", "deepseek-r1:14b", "gemma3:12b",
  ],
  glm: ["glm-4-flash", "glm-4-flashx", "glm-4-air", "glm-4-plus", "glm-4-long"],
  gemini: ["gemini-3.8-flash", "gemini-flash-latest", "gemini-flash-lite-latest"],
  groq: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "gemma2-9b-it", "deepseek-r1-distill-llama-70b"],
  openrouter: ["google/gemma-4-31b-it:free", "google/gemma-4-26b-a4b-it:free", "nvidia/nemotron-3.5-lightning:free"],
  anthropic: ["claude-sonnet-4-6", "claude-opus-4-8", "claude-haiku-4-5-20251001"],
};
