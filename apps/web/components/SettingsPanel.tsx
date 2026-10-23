"use client";

import { useEffect, useState } from "react";
import { type AiSettings, DEFAULT_AI, loadAi, saveAi } from "@/lib/aiSettings";
import { useLocale, type TKey } from "@/lib/i18n";
import {
  PROVIDER_META,
  STATIC_MODELS,
  FILTER_LABEL_KEYS,
  COST_LABEL_KEYS,
  filterProviders,
  type ProviderFilter,
} from "@/lib/providerMeta";

interface ModelOption {
  id: string;
  free?: boolean;
}

const MODELS_CACHE_PREFIX = "numerology-models-";
const MODELS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const FILTER_ORDER: ProviderFilter[] = ["all", "nokey", "free", "paid"];

function readModelsCache(provider: string): { models: ModelOption[]; source: string } | null {
  try {
    const raw = window.localStorage.getItem(MODELS_CACHE_PREFIX + provider);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; models: ModelOption[]; source: string };
    if (Date.now() - parsed.at > MODELS_CACHE_TTL_MS) return null;
    return { models: parsed.models, source: parsed.source };
  } catch {
    return null;
  }
}

function writeModelsCache(provider: string, models: ModelOption[], source: string): void {
  try {
    window.localStorage.setItem(
      MODELS_CACHE_PREFIX + provider,
      JSON.stringify({ at: Date.now(), models, source }),
    );
  } catch {
    /* ignore */
  }
}

export function SettingsPanel() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<AiSettings>(DEFAULT_AI);
  const [filter, setFilter] = useState<ProviderFilter>("all");
  const [models, setModels] = useState<ModelOption[]>([]);
  const [modelsSource, setModelsSource] = useState<string>("static");

  useEffect(() => {
    setValue(loadAi());
  }, []);

  // 模型列表:缓存(24h) → /api/models 动态拉取 → 静态备选。
  useEffect(() => {
    const provider = value.provider;
    const statics = (STATIC_MODELS[provider] ?? []).map((id) => ({ id }));
    const cached = readModelsCache(provider);
    if (cached && cached.models.length > 0) {
      setModels(cached.models);
      setModelsSource(cached.source);
      return;
    }
    setModels(statics);
    setModelsSource("static");
    let cancelled = false;
    (async () => {
      try {
        const headers: Record<string, string> = {};
        if (value.apiKey.trim()) headers["X-AI-Key"] = value.apiKey.trim();
        const res = await fetch(`/api/models?provider=${encodeURIComponent(provider)}`, { headers });
        if (!res.ok) return;
        const data = (await res.json()) as { models?: ModelOption[]; source?: string };
        if (cancelled || !Array.isArray(data.models) || data.models.length === 0) return;
        setModels(data.models);
        const src = data.source === "live" ? "live" : data.source === "verified-static" ? "verified-static" : "static";
        setModelsSource(src);
        writeModelsCache(provider, data.models, src);
      } catch {
        /* 保持静态备选 */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.provider]);

  function set(patch: Partial<AiSettings>) {
    const next = { ...value, ...patch };
    setValue(next);
    saveAi(next);
  }

  function selectProvider(p: string) {
    const first = (STATIC_MODELS[p] ?? [])[0] ?? "";
    set({ provider: p, model: first });
  }

  function selectFilter(f: ProviderFilter) {
    setFilter(f);
    const visible = filterProviders(f);
    // filter 后当前 provider 不可见 → 自动选中第一个可见的(保持 tab 恒有一选中)。
    if (!visible.some((p) => p.name === value.provider) && visible.length > 0) {
      selectProvider(visible[0]!.name);
    }
  }

  const visible = filterProviders(filter);
  const meta = PROVIDER_META.find((p) => p.name === value.provider) ?? PROVIDER_META[0]!;
  const modelLabel = (m: ModelOption): string => {
    const key = `settings.m.${m.id}` as TKey;
    const hit = t(key);
    const base = hit === key ? m.id : hit;
    return m.free ? `${base} (${t("settings.freeTag")})` : base;
  };
  const sourceLabel =
    modelsSource === "live"
      ? t("settings.models.live")
      : modelsSource === "verified-static"
        ? t("settings.models.verified")
        : t("settings.models.static");

  return (
    <div className="settings">
      <button type="button" className="settings-toggle" onClick={() => setOpen((o) => !o)}>
        {t("settings.toggle")} {t(meta.shortKey)}
        <span className="caret">{open ? "▴" : "▾"}</span>
      </button>

      {open ? (
        <div className="settings-body">
          <label className="fld" htmlFor="prov">
            {t("settings.modelLabel")}
          </label>

          {/* filter chips */}
          <div className="filter-chips" role="group" aria-label="provider filter">
            {FILTER_ORDER.map((f) => (
              <button
                key={f}
                type="button"
                className="filter-chip"
                aria-pressed={filter === f}
                onClick={() => selectFilter(f)}
              >
                {t(FILTER_LABEL_KEYS[f])}
              </button>
            ))}
          </div>

          {/* provider tabs:只显示短名 */}
          <div className="prov-tabs" role="tablist" aria-label="provider">
            {visible.map((p) => (
              <button
                key={p.name}
                type="button"
                role="tab"
                aria-selected={value.provider === p.name}
                className="prov-tab"
                onClick={() => selectProvider(p.name)}
              >
                {t(p.shortKey)}
              </button>
            ))}
          </div>

          {/* 属性面板:选中 provider 的结构化属性 */}
          <div className="prov-props">
            <div className="prov-prop">
              <span className="prov-prop-label">{t("settings.apiKey")}</span>
              <span className={`badge ${meta.needsKey ? "badge-warn" : "badge-ok"}`}>
                {meta.needsKey ? t("settings.prop.needKey") : t("settings.prop.noKey")}
              </span>
            </div>
            <div className="prov-prop">
              <span className="prov-prop-label">{t("settings.prop.cost")}</span>
              <span className="badge">{t(COST_LABEL_KEYS[meta.cost])}</span>
            </div>
            <p className="prov-note">{t(meta.noteKey)}</p>
          </div>

          {meta.needsKey || meta.optionalKey ? (
            <>
              <label className="fld" htmlFor="key" style={{ marginTop: "0.8rem" }}>
                {t("settings.apiKey")}
                {meta.signup ? (
                  <>
                    {" · "}
                    <a href={meta.signup} target="_blank" rel="noreferrer">
                      {t("settings.apply")}
                    </a>
                  </>
                ) : null}
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
          ) : models.length > 0 ? (
            <>
              <label className="fld" htmlFor="model2" style={{ marginTop: "0.8rem" }}>
                {t("settings.model")} · {sourceLabel}
              </label>
              <select
                id="model2"
                className="settings-select"
                value={value.model || models[0]!.id}
                onChange={(e) => set({ model: e.target.value })}
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {modelLabel(m)}
                  </option>
                ))}
              </select>
            </>
          ) : null}

          <p className="settings-note">
            {t("settings.noteA")}
            <b>{t("settings.noteB")}</b>
            {t("settings.noteC")}
          </p>
        </div>
      ) : null}
    </div>
  );
}
