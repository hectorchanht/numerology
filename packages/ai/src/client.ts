import type { ChartResult, FortuneAnalysis } from "@numerology/engine";
import { buildContextPack, type FortuneScope } from "./context.js";
import { SYSTEM_PERSONA, localeDirective, type AiLocale } from "./prompts.js";
import type { SystemBlock } from "./provider.js";

export type { AiLocale };

// 統一解讀層入口(多 provider:workers-ai/Pollinations/GLM/Gemini/Groq/OpenRouter/Anthropic/custom),從 provider 透出。
export {
  chatComplete,
  chatStream,
  ThinkStreamNormalizer,
  normalizeThinkText,
  activeProviderName,
  isMacProvider,
  MAC_PROVIDER_NAMES,
  MAC_PROVIDER_ALIASES,
  normalizeProviderName,
  providerSummary,
  listProviders,
  providerBaseUrl,
  providerNeedsKey,
  applyCustomPrompt,
  type Usage,
  type TextStream,
  type SystemBlock,
  type ChatMessage,
  type ModelKind,
  type ProviderOptions,
  type ProviderGroup,
  type ProviderMeta,
} from "./provider.js";

/**
 * 輸出上限默認值——以"詳實爲準、永不截斷"爲原則給足空間(並非強制寫滿,
 * 只是移除天花板;實際篇幅由 prompt 與內容決定)。長報告配合加長超時。
 */
export const MAX_TOKENS = {
  report: 16000,
  chat: 8000,
} as const;

/**
 * "人設 + 命盤事實 + 輸出語言"組裝成 system 塊,第二塊標記 cache(僅 Anthropic 生效)。
 * 報告與對話共用 → 保證兩者基於同一命盤事實;在 Anthropic 上還命中 prompt caching。
 * 語言指令單獨成第三塊,不影響前兩塊的緩存前綴。
 */
export function buildCachedSystem(
  chart: ChartResult,
  fortune?: FortuneAnalysis,
  locale: AiLocale = "zht",
  opts?: { fortuneScope?: FortuneScope },
): SystemBlock[] {
  const { markdown } = buildContextPack(chart, fortune, opts);
  return [
    { text: SYSTEM_PERSONA },
    { text: markdown, cache: true },
    { text: localeDirective(locale) },
  ];
}
