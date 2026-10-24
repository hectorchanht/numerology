"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n";
import { loadAi, saveAi, AI_SETTINGS_EVENT, type AiSettings } from "@/lib/aiSettings";
import {
  PROVIDER_META,
  STATIC_MODELS,
  filterRecommended,
  filterRetired,
  normModelId,
  staticModelEntries,
} from "@/lib/providerMeta";
import { aiNoteParts, shortModelName } from "@/lib/aiNote";
import { readModelsCache } from "@/lib/modelsCache";
import { FloatingCard, useFloatPopup } from "@/lib/floatPopup";
import { go } from "@/lib/nav";

interface ModelOption {
  id: string;
  free?: boolean;
}

/**
 * 該 provider 嘅可選模型:快取(有就用)否則靜態表 → 濾已下架 → 只留推薦
 * (推薦表為空/濾空時回落全表,保證下拉永遠有可選項;當前模型唔喺表入面就補喺最前)。
 * 同 SettingsPanel 嘅模型來源一致,唔另起一套。
 */
function modelOptions(provider: string, currentModel: string): ModelOption[] {
  const cached = readModelsCache(provider)?.models;
  const base =
    cached && cached.length > 0 ? cached : staticModelEntries(STATIC_MODELS[provider] ?? []);
  const list = filterRetired(filterRecommended(base, provider));
  if (currentModel && !list.some((m) => normModelId(m.id) === normModelId(currentModel))) {
    return [{ id: currentModel }, ...list];
  }
  return list;
}

/**
 * AI 按鈕旁邊嘅狀態 pills:provider / model / key 來源,三粒都撳得。
 * - provider pill:即場揀供應商(切換後模型跟推薦表首個,同 SettingsPanel 一致)。
 * - model pill:即場揀模型(推薦過濾後嘅表;custom 係自由輸入框,同 SettingsPanel 一致)。
 * - key pill:去設定頁(填 key 嘅入口)。
 * 改動經 saveAi 寫入同一 localStorage,Settings 改完會經 ai-settings-changed
 * 事件即時更新,之後嘅 AI call 即刻用新設定,唔使 refresh。
 */
export function AiModelNote({ style }: { style?: CSSProperties }) {
  const { t } = useLocale();
  const pathname = usePathname();
  const router = useRouter();
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

  const providerRef = useRef<HTMLButtonElement | null>(null);
  const modelRef = useRef<HTMLButtonElement | null>(null);
  const providerPopup = useFloatPopup(providerRef);
  const modelPopup = useFloatPopup(modelRef);

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

  // 模型表只喺 picker 打開嗰陣讀(快取新鮮,唔使 memo)。
  const models =
    modelPopup.open && s.provider !== "custom" ? modelOptions(s.provider, s.model.trim()) : [];
  const effectiveModel = s.model.trim() || models[0]?.id || "";

  const set = (patch: Partial<AiSettings>) => saveAi({ ...s, ...patch });

  const selectProvider = (p: string) => {
    const first = filterRecommended(staticModelEntries(STATIC_MODELS[p] ?? []), p)[0]?.id ?? "";
    set({ provider: p, model: first });
    providerPopup.setOpen(false);
  };

  const selectModel = (id: string) => {
    set({ model: id });
    modelPopup.setOpen(false);
  };

  const openSettings = () => {
    go("settings");
    if (pathname !== "/") router.push("/");
  };

  const toggleProvider = () => {
    modelPopup.setOpen(false);
    providerPopup.setOpen((v) => !v);
  };

  const toggleModel = () => {
    providerPopup.setOpen(false);
    modelPopup.setOpen((v) => !v);
  };

  return (
    <div className="ai-pills" style={style} aria-label={`${parts.provider} ${parts.model} ${parts.key}`}>
      <button
        type="button"
        ref={providerRef}
        className="pill"
        aria-haspopup="dialog"
        aria-expanded={providerPopup.open}
        onClick={toggleProvider}
      >
        {parts.provider}
      </button>
      <button
        type="button"
        ref={modelRef}
        className="pill model"
        aria-haspopup="dialog"
        aria-expanded={modelPopup.open}
        onClick={toggleModel}
      >
        {modelLabel}
      </button>
      <button
        type="button"
        className={`pill ${parts.keyTone}`}
        title={t("settings.title")}
        onClick={openSettings}
      >
        {parts.key}
      </button>

      {providerPopup.open && (
        <FloatingCard floatingRef={providerPopup.floatingRef} floatingStyles={providerPopup.floatingStyles}>
          <div className="ai-picker">
            <div className="hd">{t("settings.provider")}</div>
            {PROVIDER_META.map((p) => (
              <button
                key={p.name}
                type="button"
                className={`opt${p.name === s.provider ? " on" : ""}`}
                onClick={() => selectProvider(p.name)}
              >
                <span>{t(p.shortKey)}</span>
                {p.name === s.provider ? <span className="mk">✓</span> : null}
              </button>
            ))}
          </div>
        </FloatingCard>
      )}

      {modelPopup.open && (
        <FloatingCard floatingRef={modelPopup.floatingRef} floatingStyles={modelPopup.floatingStyles}>
          <div className="ai-picker">
            <div className="hd">{t("settings.model")}</div>
            {s.provider === "custom" ? (
              <input
                type="text"
                placeholder={t("settings.modelNamePh")}
                aria-label={t("settings.modelName")}
                value={s.model}
                onChange={(e) => set({ model: e.target.value })}
              />
            ) : (
              models.map((m) => {
                const on = normModelId(m.id) === normModelId(effectiveModel);
                return (
                  <button
                    key={m.id}
                    type="button"
                    className={`opt${on ? " on" : ""}`}
                    onClick={() => selectModel(m.id)}
                  >
                    <span>
                      {shortModelName(m.id)}
                      {m.free ? ` (${t("settings.freeTag")})` : ""}
                    </span>
                    {on ? <span className="mk">✓</span> : null}
                  </button>
                );
              })
            )}
          </div>
        </FloatingCard>
      )}
    </div>
  );
}
