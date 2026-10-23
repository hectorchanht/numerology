"use client";

import { createElement, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSpeech, type SpeechLang, type UseSpeechOptions } from "./useSpeech.js";
import {
  DEFAULT_LANGS,
  getLangBadge,
  getLangColor,
  getLangLabel,
  type PronounceLocale,
} from "./langs.js";

export type { PronounceLocale };

/**
 * 單一發音圖標按鈕(32px):左鍵播放/停止(預設第一個語言),
 * 右鍵 / 長按開語言選單切換。Framer Motion 物理回饋:
 * whileTap spring 壓縮 + 播放中雙層波紋擴散,停止即 Rest。
 *
 * 全部設定暴露給使用者:
 * - `langs`:任意 BCP-47 語言清單(預設 ["zh-HK","zh-CN"],向後兼容)
 * - `defaultLang` / `controlledLang` + `onLangChange`:語言選擇
 * - `langNames` / `langBadges` / `langColors`:標籤、角標、主題色自訂
 * - `speechOptions`:語速/音調/音量/語音 全部透傳給 useSpeech
 *
 * Self-contained:不依賴任何 app 的 i18n,語言標籤經 `locale` prop 傳入。
 * 無 Tailwind:全 inline style,顏色走 CSS 變數(--card/--sep/--label/--fill/--pop-shadow,
 * 未定義時瀏覽器回退為預設值),深淺色模式皆可。
 */

const SWITCH_HINT: Record<PronounceLocale, string> = {
  zht: "右鍵 / 長按切換語言",
  zhs: "右键 / 长按切换语言",
  en: "right-click / long-press to switch language",
};

const SPEAK_WORD: Record<PronounceLocale, string> = {
  zht: "發音",
  zhs: "发音",
  en: "speak",
};

const BTN_SIZE = 32;

export interface PronounceButtonProps {
  /** 要朗讀的文字 */
  text: string;
  /** 介面語言(只影響按鈕標籤/提示,不影響發音) */
  locale?: PronounceLocale;
  /**
   * "single":一次讀完(text 應為短句);
   * "all":先按句讀分句再排隊讀(適合段落/章節長文本)。
   */
  mode?: "single" | "all";
  /** 可選語言清單(BCP-47)。預設 ["zh-HK","zh-CN"]。 */
  langs?: SpeechLang[];
  /** 初始語言。預設為 langs[0]。 */
  defaultLang?: SpeechLang;
  /** 受控語言:傳入後按鈕語言完全由父層控制(配合 onLangChange)。 */
  controlledLang?: SpeechLang;
  /** 語言切換回調(使用者在選單選了語言時觸發)。 */
  onLangChange?: (lang: SpeechLang) => void;
  /**
   * 自訂語言顯示名:{ [bcp47]: { zht, zhs, en } }。
   * 內建 18 種常見語言,未覆寫的用內建,內建沒有的直接顯示標籤。
   */
  langNames?: Partial<
    Record<string, Partial<Record<PronounceLocale, string>>>
  >;
  /** 自訂角標:{ [bcp47]: "粵" }。預設 粵/普,其他語言退回標籤基底大寫(如 "EN")。 */
  langBadges?: Record<string, string>;
  /** 自訂主題色:{ [bcp47]: "#0071e3" }。未指定的退回 iOS 藍。 */
  langColors?: Record<string, string>;
  /** 發音設定:語速/音調/音量/指定語音/自訂語音挑選,全部透傳給 useSpeech。 */
  speechOptions?: UseSpeechOptions;
  /**
   * 按鈕上方顯示的讀音標註(如漢語拼音/粵拼/羅馬字),不傳則不顯示。
   * 純展示用,不影響發音;調用方負責提供與當前語言對應的正確讀音。
   */
  reading?: string;
}

export function PronounceButton({
  text,
  locale = "zht",
  mode = "single",
  langs,
  defaultLang,
  controlledLang,
  onLangChange,
  langNames,
  langBadges,
  langColors,
  speechOptions,
  reading,
}: PronounceButtonProps) {
  const { speak, speakAll, stop, isPlaying, currentLang } =
    useSpeech(speechOptions);
  const langList =
    langs && langs.length > 0 ? langs : DEFAULT_LANGS;
  const initialLang =
    controlledLang ??
    (defaultLang && langList.includes(defaultLang)
      ? defaultLang
      : langList[0]!);
  const [internalLang, setInternalLang] = useState<SpeechLang>(initialLang);
  const selectedLang = controlledLang ?? internalLang;
  const [showMenu, setShowMenu] = useState(false);
  const [hovered, setHovered] = useState<SpeechLang | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressMenuUntil = useRef(0); // 長按已開選單:忽略隨之而來的 contextmenu
  const onLangChangeRef = useRef(onLangChange);
  onLangChangeRef.current = onLangChange;

  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  // 受控語言變化時同步(非受控模式忽略)
  useEffect(() => {
    if (controlledLang !== undefined) setInternalLang(controlledLang);
  }, [controlledLang]);

  // 觸控長按開選單(550ms):non-passive 才能 preventDefault 擋住系統選單
  useEffect(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const clear = () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    };
    const onTouchStart = (e: TouchEvent) => {
      clear();
      longPressTimer.current = setTimeout(() => {
        e.preventDefault();
        suppressMenuUntil.current = Date.now() + 1200;
        setShowMenu(true);
      }, 550);
    };
    btn.addEventListener("touchstart", onTouchStart, { passive: false });
    btn.addEventListener("touchend", clear);
    btn.addEventListener("touchmove", clear);
    btn.addEventListener("touchcancel", clear);
    return () => {
      btn.removeEventListener("touchstart", onTouchStart);
      btn.removeEventListener("touchend", clear);
      btn.removeEventListener("touchmove", clear);
      btn.removeEventListener("touchcancel", clear);
      clear();
    };
  }, []);

  // 選單關閉規則:點選單/按鈕以外即關(hover 不關,讓觸控好操作)
  useEffect(() => {
    if (!showMenu) return;
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setShowMenu(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [showMenu]);

  if (!supported) return null;

  // 主題色跟隨「正在播放的語言」,靜態時跟隨已選語言
  const activeLang = isPlaying && currentLang ? currentLang : selectedLang;
  const themeColor = getLangColor(activeLang, langColors);
  const labelOf = (lang: SpeechLang) => getLangLabel(lang, locale, langNames);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showMenu) setShowMenu(false);
    if (isPlaying) stop();
    else if (mode === "all") speakAll(text, selectedLang);
    else speak(text, selectedLang);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (Date.now() < suppressMenuUntil.current) return; // 長按已開過
    setShowMenu((v) => !v);
  };

  const toggleLanguage = (lang: SpeechLang) => {
    setInternalLang(lang);
    setShowMenu(false);
    onLangChangeRef.current?.(lang);
    if (mode === "all") speakAll(text, lang);
    else speak(text, lang); // 切換即讀一次,即時確認
  };

  const menuItem = (lang: SpeechLang) =>
    createElement(
      "button",
      {
        key: lang,
        type: "button",
        onClick: () => toggleLanguage(lang),
        onMouseEnter: () => setHovered(lang),
        onMouseLeave: () => setHovered(null),
        style: {
          display: "block",
          width: "100%",
          textAlign: "left",
          padding: "7px 10px",
          fontSize: "12px",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          backgroundColor: hovered === lang ? "var(--fill)" : "transparent",
          color: selectedLang === lang ? getLangColor(lang, langColors) : "var(--label)",
          fontWeight: selectedLang === lang ? 600 : 400,
        },
      },
      labelOf(lang),
    );

  const selectedLabel = labelOf(selectedLang);

  const inner = createElement(
    "span",
    {
      style: {
        position: "relative",
        display: "inline-block",
        userSelect: "none",
        textAlign: "left",
      },
    },
    createElement(
      motion.button,
      {
        ref: btnRef,
        type: "button",
        onClick: handlePlay,
        onContextMenu: handleContextMenu,
        // Emil Kowalski 式輕量彈性按壓(stiff physics feel)
        whileTap: { scale: 0.88 },
        transition: { type: "spring", stiffness: 400, damping: 25 },
        "aria-label": `${selectedLabel}${SPEAK_WORD[locale] ?? SPEAK_WORD.zht}`,
        "aria-pressed": isPlaying,
        title: `${selectedLabel} · ${SWITCH_HINT[locale] ?? SWITCH_HINT.zht}`,
        style: {
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: BTN_SIZE,
          height: BTN_SIZE,
          borderRadius: "8px",
          border: `1px solid ${isPlaying ? themeColor : "var(--sep)"}`,
          backgroundColor: isPlaying ? `${themeColor}0d` : "var(--card-3)",
          color: isPlaying ? themeColor : "var(--label)",
          cursor: "pointer",
          padding: 0,
          WebkitTouchCallout: "none",
        },
      },
      // 圖標:AnimatePresence mode="wait" 做 scale 交替,避免硬切
      createElement(
        "span",
        { style: { position: "relative", zIndex: 1, display: "flex" } },
        createElement(
          AnimatePresence,
          { mode: "wait" },
          isPlaying
            ? createElement(
                motion.svg,
                {
                  key: "stop",
                  initial: { scale: 0.6, opacity: 0 },
                  animate: { scale: 1, opacity: 1 },
                  exit: { scale: 0.6, opacity: 0 },
                  transition: { duration: 0.15 },
                  viewBox: "0 0 24 24",
                  fill: "currentColor",
                  style: { width: 12, height: 12, display: "block" },
                },
                createElement("rect", {
                  x: 5,
                  y: 5,
                  width: 14,
                  height: 14,
                  rx: 1.5,
                }),
              )
            : createElement(
                motion.svg,
                {
                  key: "play",
                  initial: { scale: 0.6, opacity: 0 },
                  animate: { scale: 1, opacity: 1 },
                  exit: { scale: 0.6, opacity: 0 },
                  transition: { duration: 0.15 },
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: 2.5,
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  style: { width: 16, height: 16, display: "block" },
                },
                createElement("polygon", {
                  points: "11 5 6 9 2 9 2 15 6 15 11 19 11 5",
                }),
                createElement("path", {
                  d: "M15.54 8.46a5 5 0 0 1 0 7.07",
                }),
              ),
        ),
      ),
      // 播放中雙層波紋:停止即銷毀,回歸 Rest
      isPlaying &&
        createElement(motion.span, {
          key: "ripple-1",
          style: {
            position: "absolute",
            inset: 0,
            borderRadius: "8px",
            border: `1.5px solid ${themeColor}`,
            pointerEvents: "none",
            zIndex: 0,
          },
          animate: { scale: [1, 1.45], opacity: [0.5, 0] },
          transition: { duration: 1.6, ease: "linear", repeat: Infinity },
        }),
      isPlaying &&
        createElement(motion.span, {
          key: "ripple-2",
          style: {
            position: "absolute",
            inset: 0,
            borderRadius: "8px",
            border: `1px solid ${themeColor}`,
            pointerEvents: "none",
            zIndex: 0,
          },
          animate: { scale: [1, 1.7], opacity: [0.3, 0] },
          transition: {
            duration: 1.6,
            delay: 0.6,
            ease: "linear",
            repeat: Infinity,
          },
        }),
    ),
    // 角落語言角標
    createElement(
      "span",
      {
        style: {
          position: "absolute",
          bottom: -4,
          right: -4,
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 14,
          height: 14,
          padding: "0 3px",
          fontSize: 8,
          fontWeight: 700,
          lineHeight: 1,
          fontFamily: "ui-monospace, monospace",
          backgroundColor: "var(--card-2)",
          border: "1px solid var(--sep)",
          color: "var(--label-2)",
          borderRadius: 4,
          pointerEvents: "none",
          transform: "scale(0.85)",
          transformOrigin: "bottom right",
        },
      },
      getLangBadge(selectedLang, langBadges),
    ),
    // 語言切換選單
    showMenu &&
      createElement(
        motion.div,
        {
          ref: menuRef,
          initial: { opacity: 0, scale: 0.95, y: -4 },
          animate: { opacity: 1, scale: 1, y: 0 },
          transition: { duration: 0.12, ease: "easeOut" },
          style: {
            position: "absolute",
            right: 0,
            top: "100%",
            marginTop: 4,
            minWidth: 84,
            backgroundColor: "var(--card)",
            border: "1px solid var(--sep)",
            borderRadius: 10,
            boxShadow: "var(--pop-shadow)",
            padding: 4,
            zIndex: 30,
          },
        },
        ...langList.map(menuItem),
      ),
  );

  // reading 有傳:讀音標註疊在按鈕上方(直式小單元);無傳:維持原 32px 單鈕
  if (!reading) return inner;
  return createElement(
    "span",
    {
      style: {
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        userSelect: "none",
      },
    },
    createElement(
      "span",
      {
        "aria-hidden": true,
        style: {
          fontSize: 11,
          lineHeight: 1.3,
          fontWeight: 500,
          letterSpacing: "0.02em",
          whiteSpace: "nowrap",
          color: "var(--label-2)",
        },
      },
      reading,
    ),
    inner,
  );
}
