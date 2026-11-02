"use client";

import { useState } from "react";
import { useLocale } from "../lib/i18n";

/**
 * 思考過程折疊塊(2026-11-02,Hector 定版面:思考 → TL;DR → 全文)。
 * 預設折疊;生成中(諗緊)header 顯示「思考中…」但同樣保持折疊,唔自動彈開。
 * 思考為空又唔係生成中 → 成塊唔渲染。純文字狀態,唔用 spinner/skeleton
 * (loading 指示 XOR 規則:呢度冇 loading 區,只有狀態字)。
 */
export default function ThinkingFold({
  thinking,
  active = false,
}: {
  thinking: string;
  /** 生成中而且思考未完(未閉合 </think>)。 */
  active?: boolean;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const text = thinking.trim();
  if (!text && !active) return null;
  const label = active ? t("report.thinkingActive") : t("report.thinking");
  return (
    <div className="think-fold">
      <button
        type="button"
        className="think-head"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="think-chevron" aria-hidden>
          {open ? "▾" : "▸"}
        </span>
        {label}
      </button>
      {open && text ? <div className="think-body">{text}</div> : null}
    </div>
  );
}
