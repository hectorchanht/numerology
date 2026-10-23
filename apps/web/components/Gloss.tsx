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
          borderBottom: "1px dotted var(--accent-line)",
          cursor: "pointer",
          color: "var(--label)",
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
            minWidth: "min(220px, 70vw)",
            maxWidth: "min(300px, 80vw)",
            background: "var(--card-2)",
            borderRadius: "12px",
            padding: "10px 14px",
            fontSize: "14px",
            lineHeight: 1.6,
            color: "var(--label-2)",
            boxShadow: "var(--pop-shadow)",
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
