"use client";

import { createElement, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSpeech, type SpeechLang } from "./useSpeech.js";

/**
 * 單一發音圖標按鈕(32px):左鍵播放/停止(預設廣東話),
 * 右鍵 / 長按開語言選單切換普通話。Framer Motion 物理回饋:
 * whileTap spring 壓縮 + 播放中雙層波紋擴散,停止即 Rest。
 *
 * Self-contained:不依賴任何 app 的 i18n,語言標籤經 `locale` prop 傳入。
 * 無 Tailwind:全 inline style,顏色走 CSS 變數(--card/--sep/--label/--fill/--pop-shadow,
 * 未定義時瀏覽器回退為預設值),深淺色模式皆可。
 */

export type PronounceLocale = "zht" | "zhs" | "en";

const CANTO_COLOR = "#0071e3"; // iOS 藍
const MANDO_COLOR = "#34c759"; // iOS 綠

const LANG_NAME: Record<PronounceLocale, Record<SpeechLang, string>> = {
  zht: { "zh-HK": "廣東話", "zh-CN": "普通話" },
  zhs: { "zh-HK": "广东话", "zh-CN": "普通话" },
  en: { "zh-HK": "Cantonese", "zh-CN": "Mandarin" },
};

const SWITCH_HINT: Record<PronounceLocale, string> = {
  zht: "右鍵 / 長按切換語言",
  zhs: "右键 / 长按切换语言",
  en: "right-click / long-press to switch",
};

const BTN_SIZE = 32;

export function PronounceButton({
  text,
  locale = "zht",
}: {
  /** 要朗讀的文字 */
  text: string;
  /** 介面語言(只影響按鈕標籤/提示,不影響發音) */
  locale?: PronounceLocale;
}) {
  const { speak, stop, isPlaying, currentLang } = useSpeech();
  const [selectedLang, setSelectedLang] = useState<SpeechLang>("zh-HK");
  const [showMenu, setShowMenu] = useState(false);
  const [hovered, setHovered] = useState<SpeechLang | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressMenuUntil = useRef(0); // 長按已開選單:忽略隨之而來的 contextmenu

  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window;

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
  const isCanto =
    currentLang === "zh-HK" || (!isPlaying && selectedLang === "zh-HK");
  const themeColor = isCanto ? CANTO_COLOR : MANDO_COLOR;
  const names = LANG_NAME[locale] ?? LANG_NAME.zht;

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showMenu) setShowMenu(false);
    if (isPlaying) stop();
    else speak(text, selectedLang);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (Date.now() < suppressMenuUntil.current) return; // 長按已開過
    setShowMenu((v) => !v);
  };

  const toggleLanguage = (lang: SpeechLang) => {
    setSelectedLang(lang);
    setShowMenu(false);
    speak(text, lang); // 切換即讀一次,即時確認
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
          color:
            selectedLang === lang
              ? lang === "zh-HK"
                ? CANTO_COLOR
                : MANDO_COLOR
              : "var(--label)",
          fontWeight: selectedLang === lang ? 600 : 400,
        },
      },
      names[lang],
    );

  return createElement(
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
        "aria-label": `${names[selectedLang]}發音`,
        "aria-pressed": isPlaying,
        title: `${names[selectedLang]} · ${SWITCH_HINT[locale] ?? SWITCH_HINT.zht}`,
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
    // 角落語言角標:粵 / 普
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
      selectedLang === "zh-HK" ? "粵" : "普",
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
            width: 84,
            backgroundColor: "var(--card)",
            border: "1px solid var(--sep)",
            borderRadius: 10,
            boxShadow: "var(--pop-shadow)",
            padding: 4,
            zIndex: 30,
          },
        },
        menuItem("zh-HK"),
        menuItem("zh-CN"),
      ),
  );
}
