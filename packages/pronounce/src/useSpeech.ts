"use client";

import { useState, useEffect, useCallback } from "react";

/** 支援的發音語言:粵語(zh-HK)/國語(zh-CN)。 */
export type SpeechLang = "zh-HK" | "zh-CN";

export interface UseSpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
}

/**
 * 核心發音 Hook:Web Speech API 朗讀(零成本、裝置端發聲,不耗 AI 額度)。
 * - speak(text, lang):立即中斷上一次發音再讀,連點保持高靈敏度。
 * - isPlaying/currentLang:追蹤播放狀態,供 UI 顯示「播放中」。
 * - stop():手動中斷。
 * SSR 安全:所有 window.speechSynthesis 存取都在事件/ effect 內。
 */
export function useSpeech(options: UseSpeechOptions = {}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLang, setCurrentLang] = useState<SpeechLang | null>(null);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setCurrentLang(null);
    }
  }, []);

  const speak = useCallback(
    (text: string, lang: SpeechLang) => {
      if (typeof window === "undefined" || !window.speechSynthesis || !text.trim())
        return;

      // 立即中斷上一次發音,維持高靈敏度連續點擊體驗
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = options.rate ?? 1.0;
      utterance.pitch = options.pitch ?? 1.0;
      utterance.volume = options.volume ?? 1.0;

      // 尋找系統最匹配的方言語音包
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find((v) => v.lang.replace("_", "-").includes(lang));
      if (voice) utterance.voice = voice;

      // 狀態追蹤
      utterance.onstart = () => {
        setIsPlaying(true);
        setCurrentLang(lang);
      };
      const reset = () => {
        setIsPlaying(false);
        setCurrentLang(null);
      };
      utterance.onend = reset;
      utterance.onerror = reset;

      window.speechSynthesis.speak(utterance);
    },
    [options.rate, options.pitch, options.volume],
  );

  // 確保 Chrome/Safari 語音列表正確初始化(voices 非同步載入)
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const synth = window.speechSynthesis;
    const prime = () => synth.getVoices();
    prime();
    synth.addEventListener("voiceschanged", prime);
    return () => synth.removeEventListener("voiceschanged", prime);
  }, []);

  return { speak, stop, isPlaying, currentLang };
}
