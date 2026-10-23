"use client";

import {
  Children,
  cloneElement,
  createElement,
  isValidElement,
  useRef,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  MINGLI_GLOSSARY,
  YIJING_GLOSSARY,
  type GlossaryTerm,
} from "@numerology/knowledge";
// 相對引用(非 @/):node --test 經 test-dist 執行時 @/ 無法解析,
// Next 端經 extensionAlias 同樣解到 ./i18n.ts,同一模組。
import { useLocale } from "./i18n.js";
import { PronounceButton } from "@dawn-studio/pronounce";
import { FloatingCard, useFloatPopup } from "./floatPopup.js";
import { QUOTEREF_SKIP_PROP, QuoteRef } from "./quoteRef.js";

/* ── 合併術語表 ─────────────────────────────────────────────── */

/** 合併 YIJING_GLOSSARY + MINGLI_GLOSSARY,按 term 去重(碰撞時易經優先)。 */
let mergedCache: GlossaryTerm[] | null = null;
export function allGlossary(): GlossaryTerm[] {
  if (!mergedCache) {
    const map = new Map<string, GlossaryTerm>();
    for (const g of MINGLI_GLOSSARY) map.set(g.term, g);
    for (const g of YIJING_GLOSSARY) map.set(g.term, g); // 易經優先
    mergedCache = [...map.values()];
  }
  return mergedCache;
}

/** 查合併術語表 */
export function lookupTerm(term: string): GlossaryTerm | undefined {
  return allGlossary().find((g) => g.term === term);
}

/* ── 純函數:找術語命中 ───────────────────────────────────────── */

export interface TermMatch {
  /** 命中起點(含) */
  start: number;
  /** 命中終點(不含) */
  end: number;
  /** 命中的術語原文 */
  term: string;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildTermRegex(terms: GlossaryTerm[]): RegExp | null {
  const names = terms
    .map((g) => g.term)
    .filter((t) => t.length > 0)
    .sort((a, b) => b.length - a.length || (a < b ? -1 : 1));
  if (names.length === 0) return null;
  return new RegExp(names.map(escapeRegExp).join("|"), "g");
}

let defaultRegex: RegExp | null | undefined;
/**
 * 單次掃描找出所有術語命中:一個預編譯正則(術語按長度降序,正則轉義),
 * 不重疊、無嵌套,同一起點最長者勝。
 */
export function findTermMatches(text: string, terms?: GlossaryTerm[]): TermMatch[] {
  if (!text) return [];
  let re: RegExp | null;
  if (terms === undefined) {
    if (defaultRegex === undefined) defaultRegex = buildTermRegex(allGlossary());
    re = defaultRegex;
  } else {
    re = buildTermRegex(terms);
  }
  if (!re) return [];
  re.lastIndex = 0;
  const out: TermMatch[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m[0].length === 0) {
      re.lastIndex++;
      continue;
    }
    out.push({ start: m.index, end: m.index + m[0].length, term: m[0] });
  }
  return out;
}

/* ── Term:點按釋義 ──────────────────────────────────────────── */

/**
 * 術語點按釋義:虛線底線(僅底線,不改文字顏色),點一下彈出小釋義卡(當前語言)。
 * 彈窗定位經 useFloatPopup(@floating-ui/react):flip + shift 保證永不超出 viewport。
 * POPUP DISMISSAL RULE:點別處 / 按 Escape 即關;點術語本身切換開關。
 * 查無此術語時退化為純文字。
 */
export function Term({ term }: { term: string }) {
  const { locale } = useLocale();
  const anchorRef = useRef<HTMLSpanElement | null>(null);
  const { open, setOpen, floatingRef, floatingStyles } = useFloatPopup(anchorRef);
  const def = lookupTerm(term);

  if (!def) return createElement("span", null, term);

  return createElement(
    "span",
    { style: { display: "inline-block" } },
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
        style: {
          borderBottom: "1px dotted var(--accent-line)",
          cursor: "help",
        },
      },
      term,
    ),
    open &&
      createElement(FloatingCard, {
        floatingRef,
        floatingStyles,
        children: [
          createElement(
            "span",
            {
              key: "head",
              style: {
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.5rem",
                marginBottom: "0.25rem",
              },
            },
            createElement(
              "span",
              {
                style: {
                  fontFamily: "var(--serif)",
                  color: "var(--cinnabar)",
                },
              },
              def.term,
            ),
            createElement(PronounceButton, { text: def.term, locale }),
          ),
          createElement("span", { key: "body" }, def[locale] ?? def.zht),
        ],
      }),
  );
}

/* ── withTermHighlights:走訪 React children ─────────────────── */

/** 這些標籤的子樹整棵跳過:永不在程式碼塊或互動控制項內加釋義。 */
const SKIP_TAGS = new Set([
  "code",
  "pre",
  "a",
  "button",
  "input",
  "textarea",
  "select",
]);

function highlightString(text: string): ReactNode {
  const matches = findTermMatches(text);
  if (matches.length === 0) return text;
  const parts: ReactNode[] = [];
  let cursor = 0;
  matches.forEach((m, i) => {
    if (m.start > cursor) parts.push(text.slice(cursor, m.start));
    parts.push(createElement(Term, { term: m.term, key: `t${i}@${m.start}` }));
    cursor = m.end;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

/**
 * 走訪 React children:字串按術語命中切分並以 <Term> 包裹;
 * 遞迴進入元素,但 code/pre/a/button/input/textarea/select 子樹整棵跳過。
 * 保留原有 React key。
 */
export function withTermHighlights(children: ReactNode): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child === "string") return highlightString(child);
    if (isValidElement(child)) {
      // 古籍引文參照(QuoteRef)整棵跳過:引文內部不套術語釋義,避免彈窗套彈窗。
      // 以元素類型判定(QuoteRef 元素本身的 props 只有 entry,標記在渲染輸出內)。
      if (child.type === QuoteRef) return child;
      const cprops = child.props as Record<string, unknown> | null;
      if (cprops && cprops[QUOTEREF_SKIP_PROP]) return child;
      const type = (child as ReactElement).type;
      if (typeof type === "string" && SKIP_TAGS.has(type)) return child;
      const grand = (child.props as { children?: ReactNode } | null)?.children;
      if (grand === undefined || grand === null) return child;
      // cloneElement 保留原 key(不覆寫)。
      return cloneElement(child as ReactElement, {
        children: withTermHighlights(grand),
      } as Partial<unknown>);
    }
    return child;
  });
}

/* ── react-markdown components 覆寫 ─────────────────────────── */

import type { Components } from "react-markdown";

function mdComponent(tag: string): NonNullable<Components[keyof Components]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const C = (props: any) => {
    const { node: _node, children, ...rest } = props;
    return createElement(tag, rest, withTermHighlights(children));
  };
  return C as NonNullable<Components[keyof Components]>;
}

/**
 * react-markdown `components` 覆寫:段落/列表/表格/引言/標題/強調
 * 的文字走術語釋義。刻意不覆寫 code / pre / a(與 SKIP_TAGS 一致)。
 */
export const markdownTermComponents: Components = {
  p: mdComponent("p") as Components["p"],
  li: mdComponent("li") as Components["li"],
  td: mdComponent("td") as Components["td"],
  th: mdComponent("th") as Components["th"],
  blockquote: mdComponent("blockquote") as Components["blockquote"],
  h1: mdComponent("h1") as Components["h1"],
  h2: mdComponent("h2") as Components["h2"],
  h3: mdComponent("h3") as Components["h3"],
  h4: mdComponent("h4") as Components["h4"],
  strong: mdComponent("strong") as Components["strong"],
  em: mdComponent("em") as Components["em"],
};
