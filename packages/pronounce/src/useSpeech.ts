"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * 朗讀語言:任意 BCP-47 標籤("zh-HK"、"zh-CN"、"en-US"、"ja-JP"…),
 * 實際可用視裝置系統語音包而定。
 */
export type SpeechLang = string;

/** 常用標籤的短寫常量(向後兼容舊版 "zh-HK" | "zh-CN")。 */
export const ZH_HK: SpeechLang = "zh-HK";
export const ZH_CN: SpeechLang = "zh-CN";

/** useSpeech 的全部設定:全部暴露給使用者,無隱藏預設。 */
export interface UseSpeechOptions {
  /** 語速(0.1–10,預設 1.0) */
  rate?: number;
  /** 音調(0–2,預設 1.0) */
  pitch?: number;
  /** 音量(0–1,預設 1.0) */
  volume?: number;
  /**
   * 指定語音:匹配 SpeechSynthesisVoice.name 或 voiceURI(精確相等)。
   * 未指定時按語言自動挑選。
   */
  voice?: string | null;
  /**
   * 自訂語音挑選邏輯,優先於內建自動匹配。
   * 傳回 undefined 則退回內建匹配。
   */
  pickVoice?: (
    voices: SpeechSynthesisVoice[],
    lang: SpeechLang,
  ) => SpeechSynthesisVoice | undefined;
}

/**
 * 內建語音挑選(純函數,可測試):
 * 1. 指定 voice 名/URI 精確匹配(優先)
 * 2. 中文變體:只在組內匹配(國語 zh-CN/zh-TW 一組,粵語 zh-HK/yue-HK 一組),
 *    絕不跨組(粵語/國語互不相通,讀錯語言比無聲更差);組內無則回 undefined,
 *    等瀏覽器按 utterance.lang 自行處理
 * 3. 其他語言:lang 精確匹配 → 基底語言匹配(如 lang "en-US" 配 voice.lang "en")
 * 4. 退回 undefined(瀏覽器用 utterance.lang 的預設語音)
 */
export function resolveVoice<
  V extends Pick<SpeechSynthesisVoice, "lang" | "name" | "voiceURI">,
>(voices: V[], lang: SpeechLang, preferred?: string | null): V | undefined {
  if (preferred) {
    const hit = voices.find(
      (v) => v.name === preferred || v.voiceURI === preferred,
    );
    if (hit) return hit;
  }
  const norm = (t: string) => t.replace("_", "-").toLowerCase();
  const want = norm(lang);
  // 中文變體分組:國語 / 粵語(新版 macOS 欣欣上報 yue-HK,視同 zh-HK)
  const CN_GROUPS = [
    ["zh-cn", "zh-tw"],
    ["zh-hk", "yue-hk"],
  ];
  const group = CN_GROUPS.find((g) => g.includes(want));
  if (group) {
    const exact = voices.find((v) => norm(v.lang) === want);
    if (exact) return exact;
    const alt = group.find((t) => t !== want);
    return alt ? voices.find((v) => norm(v.lang) === alt) : undefined;
  }
  const exact = voices.find((v) => norm(v.lang) === want);
  if (exact) return exact;
  const base = want.split("-")[0]!;
  const baseHit = voices.find((v) => norm(v.lang).split("-")[0] === base);
  return baseHit;
}

/** BCP-47 標籤正規化("zh_HK" → "zh-HK"),供比較用。 */
export function normalizeLangTag(tag: string): string {
  return tag.replace("_", "-");
}

/**
 * 把長文本切成適合單次 utterance 的短句(純函數,可測試)。
 * 按中英句讀 。！？!?… 及換行切分,過短的合併,超長的按 maxLen 硬切。
 */
export function splitSpeechSentences(text: string, maxLen = 120): string[] {
  const out: string[] = [];
  // 先按換行分段,再在段內按句讀切分
  for (const line of text.split("\n")) {
    const cleaned = line.replace(/\s+/g, " ").trim();
    if (!cleaned) continue;
    const raw = cleaned.split(/(?<=[。！？!?…])/);
    let buf = "";
    const flush = () => {
      const s = buf.trim();
      if (s) out.push(s);
      buf = "";
    };
    for (const part of raw) {
      let seg = part.trim();
      if (!seg) continue;
      // 超長無標點:按 maxLen 硬切(盡量不斷開英文單詞)
      while (seg.length > maxLen * 2) {
        let cut = maxLen;
        const sp = seg.lastIndexOf(" ", maxLen);
        if (sp > maxLen * 0.6) cut = sp;
        out.push(seg.slice(0, cut).trim());
        seg = seg.slice(cut).trim();
      }
      if (!seg) continue;
      if (buf && buf.length + 1 + seg.length > maxLen) flush();
      buf = buf ? `${buf} ${seg}` : seg;
    }
    flush();
  }
  return out;
}

/**
 * 系統語音列表 Hook(響應式):訂閱 voiceschanged,列表一到即更新。
 * 供 app 自建語音/語言設定面板用。SSR 安全。
 */
export function useVoices(): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const synth = window.speechSynthesis;
    const refresh = () => setVoices(synth.getVoices());
    refresh();
    synth.addEventListener("voiceschanged", refresh);
    return () => synth.removeEventListener("voiceschanged", refresh);
  }, []);
  return voices;
}

/**
 * 核心發音 Hook:Web Speech API 朗讀(零成本、裝置端發聲,不耗 AI 額度)。
 * 語言為任意 BCP-47 標籤,語速/音調/音量/語音全部可配。
 * - speak(text, lang):單句,立即中斷上一次發音再讀。
 * - speakAll(text, lang):長文本先分句再排隊逐句讀(避開長 utterance 在部分瀏覽器中途停頓的問題)。
 * - isPlaying/currentLang:追蹤播放狀態,供 UI 顯示「播放中」。
 * - voices:當前系統語音列表(供設定面板用)。
 * - stop():手動中斷(含排隊中的句子)。
 * SSR 安全:所有 window.speechSynthesis 存取都在事件/ effect / 回調內。
 */
export function useSpeech(options: UseSpeechOptions = {}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLang, setCurrentLang] = useState<SpeechLang | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  /** 世代計數:stop()/新 speak 使舊隊列的 onend 回調失效,防競態。 */
  const genRef = useRef(0);
  const queueRef = useRef<string[]>([]);

  const speakOne = useCallback(
    (text: string, lang: SpeechLang, gen: number) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = normalizeLangTag(lang);
      utterance.rate = options.rate ?? 1.0;
      utterance.pitch = options.pitch ?? 1.0;
      utterance.volume = options.volume ?? 1.0;

      // 語音選擇:自訂 pickVoice > 指定 voice 名/URI > 內建語言匹配
      const all = window.speechSynthesis.getVoices();
      const picked =
        options.pickVoice?.(all, lang) ?? resolveVoice(all, lang, options.voice);
      if (picked) utterance.voice = picked;

      utterance.onstart = () => {
        if (genRef.current !== gen) return;
        setIsPlaying(true);
        setCurrentLang(lang);
      };
      utterance.onend = () => {
        if (genRef.current !== gen) return;
        const next = queueRef.current.shift();
        if (next !== undefined) speakOne(next, lang, gen);
        else {
          setIsPlaying(false);
          setCurrentLang(null);
        }
      };
      utterance.onerror = () => {
        if (genRef.current !== gen) return;
        queueRef.current = [];
        setIsPlaying(false);
        setCurrentLang(null);
      };

      window.speechSynthesis.speak(utterance);
    },
    [
      options.rate,
      options.pitch,
      options.volume,
      options.voice,
      options.pickVoice,
    ],
  );

  const speak = useCallback(
    (text: string, lang: SpeechLang) => {
      if (typeof window === "undefined" || !window.speechSynthesis || !text.trim())
        return;
      // 立即中斷上一次發音(含排隊),維持高靈敏度連續點擊體驗
      window.speechSynthesis.cancel();
      const gen = ++genRef.current;
      queueRef.current = [];
      speakOne(text, lang, gen);
    },
    [speakOne],
  );

  const speakAll = useCallback(
    (text: string, lang: SpeechLang) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      const parts = splitSpeechSentences(text);
      if (parts.length === 0) return;
      window.speechSynthesis.cancel();
      const gen = ++genRef.current;
      queueRef.current = parts.slice(1);
      speakOne(parts[0]!, lang, gen);
    },
    [speakOne],
  );

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      genRef.current++; // 舊隊列回調即刻失效
      queueRef.current = [];
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setCurrentLang(null);
    }
  }, []);

  // 確保 Chrome/Safari 語音列表正確初始化(voices 非同步載入)
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const synth = window.speechSynthesis;
    const refresh = () => setVoices(synth.getVoices());
    refresh();
    synth.addEventListener("voiceschanged", refresh);
    return () => synth.removeEventListener("voiceschanged", refresh);
  }, []);

  return { speak, speakAll, stop, isPlaying, currentLang, voices };
}
