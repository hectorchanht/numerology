/** @dawn-studio/pronounce — tiny any-language pronunciation kit (Web Speech API TTS). */
export {
  useSpeech,
  useVoices,
  splitSpeechSentences,
  resolveVoice,
  normalizeLangTag,
  ZH_HK,
  ZH_CN,
  type SpeechLang,
  type UseSpeechOptions,
} from "./useSpeech.js";
export {
  DEFAULT_LANGS,
  DEFAULT_LANG_NAMES,
  DEFAULT_LANG_BADGES,
  DEFAULT_LANG_COLORS,
  FALLBACK_LANG_COLOR,
  getLangLabel,
  getLangBadge,
  getLangColor,
  type PronounceLocale,
} from "./langs.js";
export { PronounceButton, type PronounceButtonProps } from "./PronounceButton.js";
export { speechText } from "./speechText.js";
