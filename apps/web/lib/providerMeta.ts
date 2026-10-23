import type { TKey } from "./i18n.js";

/**
 * 设置面板用的 provider 元信息(客户端安全:不含任何 SDK)。
 * 与 packages/ai/src/provider.ts 的 listProviders() 保持一致(同名同序);
 * provider 增减时两处同步改。
 */
export type ProviderGroup = "nokey" | "freekey" | "paid";

export interface ProviderMeta {
  name: string;
  labelKey: TKey;
  group: ProviderGroup;
  needsKey: boolean;
  signup?: string;
}

export const GROUP_LABEL_KEYS: Record<ProviderGroup, TKey> = {
  nokey: "settings.group.nokey",
  freekey: "settings.group.freekey",
  paid: "settings.group.paid",
};

export const PROVIDER_META: ProviderMeta[] = [
  { name: "workers-ai", labelKey: "settings.prov.workersai", group: "nokey", needsKey: false },
  { name: "pollinations", labelKey: "settings.prov.pollinations", group: "nokey", needsKey: false, signup: "https://pollinations.ai/" },
  { name: "glm", labelKey: "settings.prov.glm", group: "freekey", needsKey: true, signup: "https://open.bigmodel.cn/" },
  { name: "gemini", labelKey: "settings.prov.gemini", group: "freekey", needsKey: true, signup: "https://aistudio.google.com/apikey" },
  { name: "groq", labelKey: "settings.prov.groq", group: "freekey", needsKey: true, signup: "https://console.groq.com/keys" },
  { name: "openrouter", labelKey: "settings.prov.openrouter", group: "freekey", needsKey: true, signup: "https://openrouter.ai/keys" },
  { name: "anthropic", labelKey: "settings.prov.anthropic", group: "paid", needsKey: true, signup: "https://console.anthropic.com/" },
  { name: "custom", labelKey: "settings.prov.custom", group: "paid", needsKey: true },
];

/** 静态模型备选(动态拉取失败/未缓存时的回落;workers-ai 用核验表,见 models.ts)。 */
export const STATIC_MODELS: Record<string, string[]> = {
  "workers-ai": [
    "@cf/meta/llama-3.1-8b-instruct-fp8",
    "@cf/meta/llama-3.2-3b-instruct",
    "@cf/mistralai/mistral-small-3.1-24b-instruct",
  ],
  pollinations: ["openai"],
  glm: ["glm-4-flash", "glm-4-flashx", "glm-4-air", "glm-4-plus", "glm-4-long"],
  gemini: ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"],
  groq: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "gemma2-9b-it", "deepseek-r1-distill-llama-70b"],
  openrouter: ["google/gemma-4-31b-it:free", "google/gemma-4-26b-a4b-it:free", "nvidia/nemotron-3.5-lightning:free"],
  anthropic: ["claude-sonnet-4-6", "claude-opus-4-8", "claude-haiku-4-5-20251001"],
};
