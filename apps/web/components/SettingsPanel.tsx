"use client";

import { useEffect, useState } from "react";
import { type AiSettings, DEFAULT_AI, loadAi, saveAi } from "@/lib/aiSettings";
import { useLocale, type TKey } from "@/lib/i18n";

/** provider → 模型 id 列表;显示名走 i18n(settings.m.*)。 */
const MODELS: Record<string, string[]> = {
  glm: ["glm-4-flash", "glm-4-flashx", "glm-4-air", "glm-4-plus", "glm-4-long"],
  gemini: ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"],
  groq: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "gemma2-9b-it", "deepseek-r1-distill-llama-70b"],
  openrouter: ["google/gemma-4-31b-it:free", "google/gemma-4-26b-a4b-it:free", "nvidia/nemotron-3.5-lightning:free"],
  anthropic: ["claude-sonnet-4-6", "claude-opus-4-8", "claude-haiku-4-5-20251001"],
};

const PROVIDERS: { v: string; labelKey: TKey; needsKey: boolean; signup?: string }[] = [
  { v: "pollinations", labelKey: "settings.prov.pollinations", needsKey: false },
  { v: "glm", labelKey: "settings.prov.glm", needsKey: true, signup: "https://open.bigmodel.cn/" },
  { v: "gemini", labelKey: "settings.prov.gemini", needsKey: true, signup: "https://aistudio.google.com/apikey" },
  { v: "groq", labelKey: "settings.prov.groq", needsKey: true, signup: "https://console.groq.com/keys" },
  { v: "openrouter", labelKey: "settings.prov.openrouter", needsKey: true, signup: "https://openrouter.ai/keys" },
  { v: "anthropic", labelKey: "settings.prov.anthropic", needsKey: true, signup: "https://console.anthropic.com/" },
  { v: "custom", labelKey: "settings.prov.custom", needsKey: true },
];

export function SettingsPanel() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<AiSettings>(DEFAULT_AI);

  useEffect(() => {
    setValue(loadAi());
  }, []);

  function set(patch: Partial<AiSettings>) {
    const next = { ...value, ...patch };
    setValue(next);
    saveAi(next);
  }

  const meta = PROVIDERS.find((p) => p.v === value.provider) ?? PROVIDERS[0]!;
  const modelLabel = (id: string): string => t(`settings.m.${id}` as TKey);

  return (
    <div className="settings">
      <button type="button" className="settings-toggle" onClick={() => setOpen((o) => !o)}>
        {t("settings.toggle")} {t(meta.labelKey).split("(")[0]}
        <span className="caret">{open ? "▴" : "▾"}</span>
      </button>

      {open ? (
        <div className="settings-body">
          <label className="fld" htmlFor="prov">
            {t("settings.modelLabel")}
          </label>
          <select
            id="prov"
            className="settings-select"
            value={value.provider}
            onChange={(e) => {
              const p = e.target.value;
              set({ provider: p, model: MODELS[p]?.[0] ?? "" });
            }}
          >
            {PROVIDERS.map((p) => (
              <option key={p.v} value={p.v}>
                {t(p.labelKey)}
              </option>
            ))}
          </select>

          {meta.needsKey ? (
            <>
              <label className="fld" htmlFor="key" style={{ marginTop: "0.8rem" }}>
                {t("settings.apiKey")}{meta.signup ? <> · <a href={meta.signup} target="_blank" rel="noreferrer">{t("settings.apply")}</a></> : null}
              </label>
              <input
                id="key"
                className="settings-input"
                type="password"
                autoComplete="off"
                placeholder={t("settings.apiKeyPh")}
                value={value.apiKey}
                onChange={(e) => set({ apiKey: e.target.value })}
              />
            </>
          ) : null}

          {value.provider === "custom" ? (
            <>
              <label className="fld" htmlFor="base" style={{ marginTop: "0.8rem" }}>
                {t("settings.baseUrl")}
              </label>
              <input
                id="base"
                className="settings-input"
                placeholder="https://.../v1"
                value={value.baseURL}
                onChange={(e) => set({ baseURL: e.target.value })}
              />
              <label className="fld" htmlFor="model" style={{ marginTop: "0.8rem" }}>
                {t("settings.modelName")}
              </label>
              <input
                id="model"
                className="settings-input"
                placeholder={t("settings.modelNamePh")}
                value={value.model}
                onChange={(e) => set({ model: e.target.value })}
              />
            </>
          ) : MODELS[value.provider] ? (
            <>
              <label className="fld" htmlFor="model2" style={{ marginTop: "0.8rem" }}>
                {t("settings.model")}
              </label>
              <select
                id="model2"
                className="settings-select"
                value={value.model || MODELS[value.provider]![0]!}
                onChange={(e) => set({ model: e.target.value })}
              >
                {MODELS[value.provider]!.map((m) => (
                  <option key={m} value={m}>
                    {modelLabel(m)}
                  </option>
                ))}
              </select>
            </>
          ) : null}

          <p className="settings-note">
            {t("settings.noteA")}<b>{t("settings.noteB")}</b>{t("settings.noteC")}
          </p>
        </div>
      ) : null}
    </div>
  );
}
