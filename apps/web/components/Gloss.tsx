"use client";

import { useState } from "react";
import { YIJING_GLOSSARY, type YijingLocale } from "@numerology/knowledge";

/**
 * 術語點按釋義:虛線底線的術語,點一下彈出小釋義卡(當前語言)。
 * 用於占卦頁與六十四卦庫。
 */
export function Gloss({
  term,
  locale,
}: {
  term: string;
  locale: YijingLocale;
}) {
  const [open, setOpen] = useState(false);
  const def = YIJING_GLOSSARY.find((g) => g.term === term);
  if (!def) return <>{term}</>;
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <span
        role="button"
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setOpen((v) => !v);
        }}
        style={{
          borderBottom: "1px dotted var(--cinnabar-soft)",
          cursor: "help",
          color: "var(--ink)",
        }}
        aria-expanded={open}
      >
        {term}
      </span>
      {open && (
        <span
          style={{
            position: "absolute",
            zIndex: 20,
            left: 0,
            top: "1.7em",
            minWidth: "220px",
            maxWidth: "300px",
            background: "var(--surface)",
            border: "1px solid var(--line-strong)",
            borderRadius: "8px",
            padding: "0.6rem 0.8rem",
            fontSize: "0.8rem",
            lineHeight: 1.6,
            color: "var(--ink-soft)",
            boxShadow: "0 8px 24px oklch(40% 0.02 60 / 0.18)",
          }}
        >
          <span
            style={{
              display: "block",
              fontFamily: "var(--serif)",
              color: "var(--cinnabar)",
              marginBottom: "0.25rem",
            }}
          >
            {def.term}
          </span>
          {def[locale] ?? def.zht}
        </span>
      )}
    </span>
  );
}
