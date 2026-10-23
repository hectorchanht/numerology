"use client";

import {
  createElement,
  type ReactNode,
} from "react";
import { FloatingCard, useFloatPopup } from "./floatPopup.js";
import { useRef } from "react";

/* ── 古籍引文參照(證據鏈) ──────────────────────────────────────
 * 課文引用的古籍原文:行內引號 + 實線底線(與 Term 的虛線底線區分,
 * 文字顏色不變),點按彈出全文 + 出處標籤 + 原文鏈接。
 * 條目數據見 app/yijing/academy/lessons.ts 的 ACADEMY_QUOTE_REFS
 * (此處只定義結構,避免把 app 層數據拉進 lib 的測試編譯)。
 * 定位經 useFloatPopup(@floating-ui/react):flip + shift 保證永不超出 viewport。
 * POPUP DISMISSAL RULE:點別處 / 按 Escape 即關;點引文本身切換開關。
 */

/** 引文參照條目(結構對應 lessons.ts 的 AcademyQuoteRef)。 */
export interface QuoteRefEntry {
  id: string;
  /** 短引文(課文所引) */
  quote: string;
  /** 較完整的原文段落(公有領域原文,逐字核實) */
  fullText: string;
  /** 出處標籤,如《繫辭上·第五章》 */
  sourceLabel: string;
  /** 已核實的公有領域原文鏈接 */
  url: string;
}

/**
 * withTermHighlights 遇到帶此 prop 的元素時整棵跳過——
 * 引文內部不再套術語釋義,避免彈窗套彈窗。
 */
export const QUOTEREF_SKIP_PROP = "data-academy-quote-ref";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function QuoteRef({ entry }: { entry: QuoteRefEntry }) {
  const anchorRef = useRef<HTMLSpanElement | null>(null);
  const { open, setOpen, floatingRef, floatingStyles } = useFloatPopup(anchorRef);

  return createElement(
    "span",
    {
      style: { display: "inline-block" },
      [QUOTEREF_SKIP_PROP]: entry.id,
    },
    createElement(
      "span",
      {
        ref: anchorRef,
        role: "button",
        tabIndex: 0,
        onClick: () => setOpen((v: boolean) => !v),
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") setOpen((v: boolean) => !v);
        },
        "aria-expanded": open,
        title: entry.sourceLabel,
        style: {
          borderBottom: "1px solid var(--accent-line)",
          cursor: "help",
        },
      },
      `「${entry.quote}」`,
    ),
    open &&
      createElement(FloatingCard, {
        floatingRef,
        floatingStyles,
        children: [
          createElement(
            "div",
            {
              key: "text",
              style: {
                fontFamily: "var(--serif)",
                marginBottom: "0.45rem",
              },
            },
            entry.fullText,
          ),
          createElement(
            "div",
            {
              key: "src",
              style: {
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.6rem",
              },
            },
            createElement(
              "span",
              { style: { color: "var(--cinnabar)" } },
              entry.sourceLabel,
            ),
            createElement(
              "a",
              {
                href: entry.url,
                target: "_blank",
                rel: "noopener noreferrer",
                onClick: (e: React.MouseEvent) => e.stopPropagation(),
                style: { whiteSpace: "nowrap", flexShrink: 0 },
              },
              "查原文 ↗",
            ),
          ),
        ],
      }),
  );
}

/**
 * 把段落文字中的引文切出來,以 <QuoteRef> 包裹。
 * 引文按長度降序匹配,最長者勝;無命中時原樣返回原字串。
 */
export function withQuoteRefs(
  text: string,
  refs: QuoteRefEntry[],
): ReactNode {
  if (!text || refs.length === 0) return text;
  const sorted = [...refs].sort((a, b) => b.quote.length - a.quote.length);
  const re = new RegExp(
    sorted.map((r) => escapeRegExp(r.quote)).join("|"),
    "g",
  );
  const byQuote = new Map(sorted.map((r) => [r.quote, r]));
  const parts: ReactNode[] = [];
  let cursor = 0;
  let m: RegExpExecArray | null;
  re.lastIndex = 0;
  while ((m = re.exec(text)) !== null) {
    if (m[0].length === 0) {
      re.lastIndex++;
      continue;
    }
    if (m.index > cursor) parts.push(text.slice(cursor, m.index));
    const entry = byQuote.get(m[0]);
    if (entry) {
      parts.push(
        createElement(QuoteRef, { entry, key: `q:${entry.id}@${m.index}` }),
      );
    } else {
      parts.push(m[0]);
    }
    cursor = m.index + m[0].length;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  if (parts.length === 0) return text;
  if (parts.length === 1 && typeof parts[0] === "string") return text;
  return parts;
}
