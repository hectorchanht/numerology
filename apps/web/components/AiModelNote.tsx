"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useLocale } from "@/lib/i18n";
import { loadAi, AI_SETTINGS_EVENT, type AiSettings } from "@/lib/aiSettings";
import { PROVIDER_META } from "@/lib/providerMeta";
import { aiNoteParts, shortModelName } from "@/lib/aiNote";

/**
 * AI 按鈕旁邊嘅狀態 pills:provider / model / key 來源。
 * 例如:[OpenRouter] [gemma-4-26b-a4b-it:free] [你的 key]。
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
  const parts = aiNoteParts(
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
  // model pill:冇自選就顯示「預設」(去括號,乾淨啲)
  const modelLabel = s.model.trim()
    ? shortModelName(s.model.trim())
    : t("aiNote.defaultSuffix").replace(/[（）()]/g, "");

  return (
    <div className="ai-pills" style={style} aria-label={`${parts.provider} ${parts.model} ${parts.key}`}>
      <span className="pill">{parts.provider}</span>
      <span className="pill model">{modelLabel}</span>
      <span className={`pill ${parts.keyTone}`}>{parts.key}</span>
    </div>
  );
}
