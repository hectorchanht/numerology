"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
} from "@floating-ui/react";
import { useSpeech, type SpeechLang } from "@dawn-studio/pronounce";
import { useLocale } from "@/lib/i18n";
import { AiModelNote } from "@/components/AiModelNote";
import { lookupTerm, markdownTermComponents } from "@/lib/highlightTerms";
import { requestChatAsk, isChatAvailable } from "@/lib/chatJump";
import { go } from "@/lib/nav";

/* ── 選詞浮動工具列 ─────────────────────────────────────────────
 * 全域監聽文字選取(≥2 字):在選區上方彈出工具列 —
 * [🔊 廣東話] [🔊 普通話] [💬 AI 解釋] [📖 釋義(術語才有)]。
 * - 朗讀:零成本裝置端 TTS(@dawn-studio/pronounce)。
 * - AI 解釋:POST /api/explain(走 $2 預算守衛 + KV 緩存),原地 popover 顯示答案,
 *   可一鍵跳去 AI Chat 深入問(主 app 有命盤時才顯示)。
 * - 釋義:命中術語表即顯示一句釋義,免 AI。
 * 定位經 floating-ui:flip + shift 保證永不超出 viewport(POPUP POSITIONING RULE)。
 * 輸入框/按鈕/連結內的選取不觸發;點別處 / Escape / 捲動即關。
 */

type View = "toolbar" | "explain" | "glossary" | null;

const CANTO = "#0071e3";
const MANDO = "#34c759";

const BAR_STYLE: CSSProperties = {
  zIndex: 60,
  display: "flex",
  alignItems: "center",
  gap: 2,
  background: "var(--card)",
  border: "1px solid var(--sep)",
  borderRadius: 12,
  boxShadow: "var(--pop-shadow)",
  padding: 4,
  userSelect: "none",
};

const BTN_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  border: "none",
  borderRadius: 8,
  padding: "7px 10px",
  fontSize: 13,
  lineHeight: 1.2,
  cursor: "pointer",
  background: "transparent",
  color: "var(--label)",
  whiteSpace: "nowrap",
};

const CARD_STYLE: CSSProperties = {
  zIndex: 60,
  width: "min(320px, calc(100vw - 32px))",
  background: "var(--card-2)",
  border: "1px solid var(--sep)",
  borderRadius: 12,
  boxShadow: "var(--pop-shadow)",
  color: "var(--label)",
  fontSize: "0.85rem",
  lineHeight: 1.6,
  overflow: "hidden",
};

function selectedText(): { text: string; rect: DOMRect } | null {
  if (typeof window === "undefined") return null;
  const s = window.getSelection();
  if (!s || s.isCollapsed || s.rangeCount === 0) return null;
  const text = s.toString().trim();
  if (text.length < 2 || text.length > 200) return null;
  const node = s.anchorNode;
  const el = node instanceof Element ? node : node?.parentElement;
  if (!el) return null;
  // 輸入框 / 按鈕 / 連結 / 本工具列內的選取不觸發
  if (
    el.closest(
      "input, textarea, select, [contenteditable], button, a, [data-select-ui]",
    )
  )
    return null;
  const rect = s.getRangeAt(0).getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null;
  return { text, rect };
}

export function SelectionToolbar() {
  const { t, locale } = useLocale();
  const { speak, stop, isPlaying, currentLang } = useSpeech();
  const [sel, setSel] = useState<{ text: string } | null>(null);
  const [view, setView] = useState<View>(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const viewRef = useRef<View>(null);
  viewRef.current = view;

  // floating-ui 虛擬錨點:選區 rect(快照,popover 開啟後不再跟選區跑)
  const rectRef = useRef<DOMRect | null>(null);
  const virtualEl = useMemo(
    () => ({
      getBoundingClientRect: () => rectRef.current ?? new DOMRect(),
    }),
    [],
  );
  const { refs, floatingStyles } = useFloating({
    placement: "top",
    strategy: "fixed",
    middleware: [offset(10), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });
  useEffect(() => {
    refs.setReference(virtualEl as unknown as Element);
  }, [refs, virtualEl]);

  const closeAll = useCallback(() => {
    stop();
    setSel(null);
    setView(null);
    setAnswer("");
    setErr("");
    setLoading(false);
    setCopied(false);
  }, [stop]);

  // ── 選取監聽 ──
  useEffect(() => {
    const update = () => {
      // popover 開啟中不搶焦
      if (viewRef.current === "explain" || viewRef.current === "glossary")
        return;
      const hit = selectedText();
      if (!hit) {
        if (viewRef.current === "toolbar") closeAll();
        return;
      }
      rectRef.current = hit.rect;
      setSel({ text: hit.text });
      setView("toolbar");
    };
    const onMouseUp = () => requestAnimationFrame(update);
    const onTouchEnd = () => window.setTimeout(update, 180); // iOS 選區稍晚才穩定
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.shiftKey) update();
    };
    const onScroll = () => {
      if (viewRef.current === "toolbar") closeAll();
    };
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("touchend", onTouchEnd);
    document.addEventListener("keyup", onKeyUp);
    document.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [closeAll]);

  // ── popover 關閉規則:點外面 / Escape ──
  useEffect(() => {
    if (view !== "explain" && view !== "glossary") return;
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (refs.floating.current?.contains(t)) return;
      closeAll();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAll();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [view, refs, closeAll]);

  // ── AI 解釋 ──
  useEffect(() => {
    if (view !== "explain" || !sel) return;
    let dead = false;
    setLoading(true);
    setAnswer("");
    setErr("");
    fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: sel.text, locale }),
    })
      .then(async (r) => {
        const d = (await r.json().catch(() => ({}))) as {
          answer?: string;
          error?: string;
        };
        if (!r.ok) throw new Error(d.error || t("select.explainFail"));
        return d.answer ?? "";
      })
      .then((a) => {
        if (!dead) {
          setAnswer(a);
          setLoading(false);
        }
      })
      .catch((e: unknown) => {
        if (!dead) {
          setErr(e instanceof Error ? e.message : t("select.explainFail"));
          setLoading(false);
        }
      });
    return () => {
      dead = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view === "explain" ? sel?.text : null]);

  const toggleSpeak = (lang: SpeechLang) => {
    if (!sel) return;
    if (isPlaying && currentLang === lang) stop();
    else speak(sel.text, lang);
  };

  const openExplain = () => {
    stop();
    setView("explain");
  };

  const openGlossary = () => {
    stop();
    setView("glossary");
  };

  const copyAnswer = async () => {
    try {
      await navigator.clipboard.writeText(answer);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 剪貼簿不可用時靜默 */
    }
  };

  const canJump =
    typeof window !== "undefined" &&
    isChatAvailable() &&
    window.location.pathname === "/";
  const jumpToChat = () => {
    if (!sel) return;
    const q =
      locale === "en"
        ? `What does "${sel.text}" mean?`
        : locale === "zhs"
          ? `解释「${sel.text}」是什么意思?`
          : `解釋「${sel.text}」是什麼意思?`;
    requestChatAsk(q);
    go("chat");
    closeAll();
    window.getSelection()?.removeAllRanges();
  };

  if (!sel || !view) return null;

  const speakBtn = (lang: SpeechLang, label: string, color: string) => {
    const active = isPlaying && currentLang === lang;
    return (
      <button
        key={lang}
        type="button"
        onClick={() => toggleSpeak(lang)}
        aria-pressed={active}
        aria-label={`${label}朗讀`}
        style={{
          ...BTN_STYLE,
          color: active ? color : "var(--label)",
          background: active ? `${color}1a` : "transparent",
          fontWeight: active ? 600 : 400,
        }}
      >
        <span aria-hidden="true">{active ? "⏹" : "🔊"}</span>
        {label}
      </button>
    );
  };

  // ── 工具列本體 ──
  if (view === "toolbar") {
    const termHit = lookupTerm(sel.text);
    return (
      <div
        ref={refs.setFloating}
        data-select-ui
        style={{ ...BAR_STYLE, ...floatingStyles }}
        onMouseDown={(e) => e.preventDefault()} // 保住選區,免掣先收起
        role="toolbar"
        aria-label={sel.text}
      >
        {speakBtn("zh-HK", t("select.speakCanto"), CANTO)}
        {speakBtn("zh-CN", t("select.speakMando"), MANDO)}
        <button type="button" onClick={openExplain} style={BTN_STYLE}>
          <span aria-hidden="true">💬</span>
          {t("select.explain")}
        </button>
        {termHit ? (
          <button type="button" onClick={openGlossary} style={BTN_STYLE}>
            <span aria-hidden="true">📖</span>
            {t("select.glossary")}
          </button>
        ) : null}
      </div>
    );
  }

  // ── AI 解釋 / 術語釋義 popover ──
  const isExplain = view === "explain";
  const termDef = !isExplain && sel ? lookupTerm(sel.text) : undefined;
  const title =
    sel.text.length > 18 ? `${sel.text.slice(0, 18)}…` : sel.text;
  return (
    <div
      ref={refs.setFloating}
      data-select-ui
      style={{ ...CARD_STYLE, ...floatingStyles }}
      onMouseDown={(e) => e.preventDefault()}
      role="dialog"
      aria-label={title}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "8px 12px",
          borderBottom: "1px solid var(--sep)",
        }}
      >
        <strong style={{ fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {isExplain ? `💬 ${title}` : `📖 ${title}`}
        </strong>
        <button
          type="button"
          onClick={closeAll}
          aria-label={t("select.close")}
          style={{
            ...BTN_STYLE,
            padding: "4px 8px",
            color: "var(--label-2)",
          }}
        >
          ✕
        </button>
      </div>
      <div style={{ padding: "10px 12px", maxHeight: 260, overflowY: "auto" }}>
        {isExplain ? (
          loading ? (
            <span style={{ color: "var(--label-2)" }}>{t("select.explainLoading")}</span>
          ) : err ? (
            <span style={{ color: "var(--accent)" }}>{err}</span>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownTermComponents}>
              {answer}
            </ReactMarkdown>
          )
        ) : (
          <span>{termDef?.[locale] ?? termDef?.zht}</span>
        )}
      </div>
      {isExplain && !loading && !err && answer ? (
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "8px 12px",
            borderTop: "1px solid var(--sep)",
          }}
        >
          {canJump ? (
            <button
              type="button"
              onClick={jumpToChat}
              style={{
                ...BTN_STYLE,
                background: "var(--accent-soft)",
                color: "var(--accent)",
                fontWeight: 600,
                flex: 1,
                justifyContent: "center",
              }}
            >
              {t("select.jumpChat")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={copyAnswer}
            style={{ ...BTN_STYLE, color: "var(--label-2)" }}
          >
            {copied ? `✓ ${t("select.copied")}` : t("select.copy")}
          </button>
        </div>
      ) : null}
      {isExplain ? <AiModelNote style={{ padding: "2px 12px 10px" }} /> : null}
    </div>
  );
}
