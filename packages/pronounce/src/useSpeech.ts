"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/** 支援的發音語言:粵語(zh-HK)/國語(zh-CN)。 */
export type SpeechLang = "zh-HK" | "zh-CN";

export interface UseSpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
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
 * 核心發音 Hook:Web Speech API 朗讀(零成本、裝置端發聲,不耗 AI 額度)。
 * - speak(text, lang):單句,立即中斷上一次發音再讀。
 * - speakAll(text, lang):長文本先分句再排隊逐句讀(避開長 utterance 在部分瀏覽器中途停頓的問題)。
 * - isPlaying/currentLang:追蹤播放狀態,供 UI 顯示「播放中」。
 * - stop():手動中斷(含排隊中的句子)。
 * SSR 安全:所有 window.speechSynthesis 存取都在事件/ effect / 回調內。
 */
export function useSpeech(options: UseSpeechOptions = {}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLang, setCurrentLang] = useState<SpeechLang | null>(null);
  /** 世代計數:stop()/新 speak 使舊隊列的 onend 回調失效,防競態。 */
  const genRef = useRef(0);
  const queueRef = useRef<string[]>([]);

  const speakOne = useCallback(
    (text: string, lang: SpeechLang, gen: number) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = options.rate ?? 1.0;
      utterance.pitch = options.pitch ?? 1.0;
      utterance.volume = options.volume ?? 1.0;

      // 尋找系統最匹配的方言語音包
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find((v) => v.lang.replace("_", "-").includes(lang));
      if (voice) utterance.voice = voice;

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
    [options.rate, options.pitch, options.volume],
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
    const prime = () => synth.getVoices();
    prime();
    synth.addEventListener("voiceschanged", prime);
    return () => synth.removeEventListener("voiceschanged", prime);
  }, []);

  return { speak, speakAll, stop, isPlaying, currentLang };
}
