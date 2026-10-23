import type { TKey } from "./i18n.js";

/**
 * 设置面板用的 provider 元信息(客户端安全:不含任何 SDK)。
 * 与 packages/ai/src/provider.ts 的 listProviders() 保持一致(同名同序);
 * provider 增减时两处同步改。
 */
export type ProviderGroup = "nokey" | "freekey" | "paid";

/** 费用档:free=完全免费, freetier=免费额度, paid=付费。 */
export type ProviderCost = "free" | "freetier" | "paid";

export interface ProviderMeta {
  name: string;
  /** tab 短名(仅短名,不塞描述)。 */
  shortKey: TKey;
  /** 选中后属性面板里的一行短注。 */
  noteKey: TKey;
  group: ProviderGroup;
  cost: ProviderCost;
  needsKey: boolean;
  /** key 选填(如 Pollinations:匿名可用,填 key 更稳)。 */
  optionalKey?: boolean;
  signup?: string;
}

/** 顶部 filter chips:全部 / 免 key / 免費 / 付費。免費=免 key ∪ 免费额度。 */
export type ProviderFilter = "all" | "nokey" | "free" | "paid";

export const FILTER_LABEL_KEYS: Record<ProviderFilter, TKey> = {
  all: "settings.filter.all",
  nokey: "settings.filter.nokey",
  free: "settings.filter.free",
  paid: "settings.filter.paid",
};

export const COST_LABEL_KEYS: Record<ProviderCost, TKey> = {
  free: "settings.prop.cost.free",
  freetier: "settings.prop.cost.freetier",
  paid: "settings.prop.cost.paid",
};

export const PROVIDER_META: ProviderMeta[] = [
  { name: "workers-ai", shortKey: "settings.tab.workersai", noteKey: "settings.note.workersai", group: "nokey", cost: "free", needsKey: false },
  { name: "pollinations", shortKey: "settings.tab.pollinations", noteKey: "settings.note.pollinations", group: "nokey", cost: "free", needsKey: false, optionalKey: true, signup: "https://pollinations.ai/" },
  { name: "glm", shortKey: "settings.tab.glm", noteKey: "settings.note.glm", group: "freekey", cost: "freetier", needsKey: true, signup: "https://open.bigmodel.cn/" },
  { name: "gemini", shortKey: "settings.tab.gemini", noteKey: "settings.note.gemini", group: "freekey", cost: "freetier", needsKey: true, signup: "https://aistudio.google.com/apikey" },
  { name: "groq", shortKey: "settings.tab.groq", noteKey: "settings.note.groq", group: "freekey", cost: "freetier", needsKey: true, signup: "https://console.groq.com/keys" },
  { name: "openrouter", shortKey: "settings.tab.openrouter", noteKey: "settings.note.openrouter", group: "freekey", cost: "freetier", needsKey: true, signup: "https://openrouter.ai/keys" },
  { name: "anthropic", shortKey: "settings.tab.anthropic", noteKey: "settings.note.anthropic", group: "paid", cost: "paid", needsKey: true, signup: "https://console.anthropic.com/" },
  { name: "custom", shortKey: "settings.tab.custom", noteKey: "settings.note.custom", group: "paid", cost: "paid", needsKey: true },
];

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

/** 带 free 标记的模型(与 SettingsPanel 的 ModelOption / models.ts 的 ModelEntry 同形)。 */
export interface FreeFlaggedModel {
  id: string;
  free?: boolean;
}

/**
 * 模型级 filter:顶部的 全部/免 key/免費/付費 同时作用于模型下拉。
 * 免費/付費是模型层级属性(OpenRouter 一个 provider 内同时有 :free 和付费模型),
 * 只 filter provider tabs 会漏掉(见截图:filter=免費却选中了付费 model)。
 * - free: 只留 free===true;若列表没有任何 free 信息(静态表无标记)则回落为不过滤,
 *   避免把下拉清空。
 * - paid: 踢掉 free===true(未知视为候选);无信息时自然全留。
 * - all/nokey: 不过滤模型(免 key 已在 provider 层过滤)。
 * 结果为空时回落为全列表,保证下拉永远有可选项。
 */
export function filterModels<T extends FreeFlaggedModel>(models: T[], filter: ProviderFilter): T[] {
  if (filter !== "free" && filter !== "paid") return models;
  const filtered =
    filter === "free" ? models.filter((m) => m.free === true) : models.filter((m) => m.free !== true);
  return filtered.length > 0 ? filtered : models;
}

/** 静态 id 列表转带 free 标记的模型项(`:free` 后缀 → free:true)。 */
export function staticModelEntries(ids: string[]): FreeFlaggedModel[] {
  return ids.map((id) => (id.endsWith(":free") ? { id, free: true } : { id }));
}

/** 静态模型备选(动态拉取失败/未缓存时的回落;workers-ai 用核验表,见 models.ts)。 */
export const STATIC_MODELS: Record<string, string[]> = {
  "workers-ai": [
    "@cf/mistralai/mistral-small-3.1-24b-instruct",
    "@cf/meta/llama-3.1-8b-instruct-fp8",
    "@cf/meta/llama-3.2-3b-instruct",
  ],
  pollinations: ["openai"],
  glm: ["glm-4-flash", "glm-4-flashx", "glm-4-air", "glm-4-plus", "glm-4-long"],
  gemini: ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"],
  groq: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "gemma2-9b-it", "deepseek-r1-distill-llama-70b"],
  openrouter: ["google/gemma-4-31b-it:free", "google/gemma-4-26b-a4b-it:free", "nvidia/nemotron-3.5-lightning:free"],
  anthropic: ["claude-sonnet-4-6", "claude-opus-4-8", "claude-haiku-4-5-20251001"],
};
