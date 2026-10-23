/** 介面語言(只影響按鈕標籤/提示,不影響發音)。 */
export type PronounceLocale = "zht" | "zhs" | "en";

/**
 * 內建語言標籤:14 種常見 BCP-47 標籤 × 三地介面語言。
 * 使用者可用 PronounceButton 的 `langNames` prop 覆寫或追加任意標籤。
 */
export const DEFAULT_LANG_NAMES: Record<
  string,
  Record<PronounceLocale, string>
> = {
  "zh-HK": { zht: "廣東話", zhs: "广东话", en: "Cantonese" },
  "zh-CN": { zht: "普通話", zhs: "普通话", en: "Mandarin" },
  "zh-TW": { zht: "國語(台灣)", zhs: "国语(台湾)", en: "Mandarin (Taiwan)" },
  "en-US": { zht: "英語(美)", zhs: "英语(美)", en: "English (US)" },
  "en-GB": { zht: "英語(英)", zhs: "英语(英)", en: "English (UK)" },
  "ja-JP": { zht: "日語", zhs: "日语", en: "Japanese" },
  "ko-KR": { zht: "韓語", zhs: "韩语", en: "Korean" },
  "es-ES": { zht: "西班牙語", zhs: "西班牙语", en: "Spanish" },
  "fr-FR": { zht: "法語", zhs: "法语", en: "French" },
  "de-DE": { zht: "德語", zhs: "德语", en: "German" },
  "it-IT": { zht: "意大利語", zhs: "意大利语", en: "Italian" },
  "pt-BR": { zht: "葡萄牙語(巴西)", zhs: "葡萄牙语(巴西)", en: "Portuguese (Brazil)" },
  "ru-RU": { zht: "俄語", zhs: "俄语", en: "Russian" },
  "th-TH": { zht: "泰語", zhs: "泰语", en: "Thai" },
  "vi-VN": { zht: "越南語", zhs: "越南语", en: "Vietnamese" },
  "id-ID": { zht: "印尼語", zhs: "印尼语", en: "Indonesian" },
  "ms-MY": { zht: "馬來語", zhs: "马来语", en: "Malay" },
  "hi-IN": { zht: "印地語", zhs: "印地语", en: "Hindi" },
};

/**
 * 內建按鈕角標(未列出的語言退回標籤基底大寫,如 "EN")。
 * 使用者可用 `langBadges` prop 覆寫。
 */
export const DEFAULT_LANG_BADGES: Record<string, string> = {
  "zh-HK": "粵",
  "zh-CN": "普",
  "zh-TW": "國",
};

/** 內建主題色(未列出的語言退回 iOS 藍)。使用者可用 `langColors` prop 覆寫。 */
export const DEFAULT_LANG_COLORS: Record<string, string> = {
  "zh-HK": "#0071e3", // iOS 藍
  "zh-CN": "#34c759", // iOS 綠
};

export const FALLBACK_LANG_COLOR = "#0071e3";

/** 取某語言在某介面語言下的顯示名:自訂 > 內建 > 標籤本身。 */
export function getLangLabel(
  lang: string,
  locale: PronounceLocale,
  custom?: Partial<Record<string, Partial<Record<PronounceLocale, string>>>>,
): string {
  const hit = custom?.[lang]?.[locale] ?? DEFAULT_LANG_NAMES[lang]?.[locale];
  return hit ?? lang;
}

/** 取某語言的角標:自訂 > 內建 > 標籤基底大寫(如 "en-US" → "EN")。 */
export function getLangBadge(
  lang: string,
  custom?: Record<string, string>,
): string {
  const hit = custom?.[lang] ?? DEFAULT_LANG_BADGES[lang];
  if (hit) return hit;
  return lang.split("-")[0]!.toUpperCase();
}

/** 取某語言的主題色:自訂 > 內建 > 預設藍。 */
export function getLangColor(
  lang: string,
  custom?: Record<string, string>,
): string {
  return custom?.[lang] ?? DEFAULT_LANG_COLORS[lang] ?? FALLBACK_LANG_COLOR;
}

/** 預設語言清單(向後兼容 0.3.x):粵語 + 普通話。 */
export const DEFAULT_LANGS = ["zh-HK", "zh-CN"];
