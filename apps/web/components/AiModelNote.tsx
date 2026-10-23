"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useLocale } from "@/lib/i18n";
import { loadAi, AI_SETTINGS_EVENT, type AiSettings } from "@/lib/aiSettings";
import { PROVIDER_META } from "@/lib/providerMeta";
import { aiNoteText } from "@/lib/aiNote";

/**
 * AI 按鈕旁邊嘅 dimmed 註腳:而家用緊邊個 model + key 狀態。
 * 例如:`mistral-small-3.1-24b · 本站免費 AI（有限額）` / `gpt-4o-mini · 你的 key`。
 * Settings 改完會經 ai-settings-changed 事件即時更新,唔使 refresh。
 */
export function AiModelNote({ style }: { style?: CSSProperties }) {
  const { t } = useLocale();
  const [s, setS] = useState<AiSettings>(() => loadAi());

  useEffect(() => {
    const refresh = () => setS(loadAi());
    window.addEventListener(AI_SETTINGS_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(AI_SETTINGS_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const meta = PROVIDER_META.find((p) => p.name === s.provider);
  const providerLabel = meta ? t(meta.shortKey) : s.provider;
  const text = aiNoteText(
    s,
    {
      siteFree: t("aiNote.siteFree"),
      free: t("aiNote.free"),
      yourKey: t("aiNote.yourKey"),
      noKey: t("aiNote.noKey"),
      defaultSuffix: t("aiNote.defaultSuffix"),
    },
    providerLabel,
  );

  return (
    <p className="muted" style={{ fontSize: "0.75rem", margin: "0.5rem 0 0", ...style }}>
      {text}
    </p>
  );
}
