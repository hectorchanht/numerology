"use client";

import { useEffect, useMemo, useState } from "react";
import { type AiSettings, DEFAULT_AI, loadAi, saveAi } from "@/lib/aiSettings";
import { useLocale, LocaleSwitch, type TKey } from "@/lib/i18n";
import { go } from "@/lib/nav";
import { Icon } from "@/components/Icon";
import {
  PROVIDER_META,
  STATIC_MODELS,
  FILTER_LABEL_KEYS,
  COST_LABEL_KEYS,
  filterProviders,
  filterModels,
  staticModelEntries,
  type ProviderFilter,
} from "@/lib/providerMeta";

interface ModelOption {
  id: string;
  free?: boolean;
}

const MODELS_CACHE_PREFIX = "numerology-models-";
const MODELS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const FILTER_ORDER: ProviderFilter[] = ["all", "nokey", "free", "paid", "recommended"];

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
  const [value, setValue] = useState<AiSettings>(DEFAULT_AI);
  const [filter, setFilter] = useState<ProviderFilter>("all");
  const [models, setModels] = useState<ModelOption[]>([]);
  const [modelsSource, setModelsSource] = useState<string>("static");

  useEffect(() => {
    setValue(loadAi());
  }, []);

  // 顶部 filter 同时是模型 filter:免费/付费作用于模型下拉;推荐只留实测可用的高性价比模型。
  const visibleModels = useMemo(
    () => filterModels(models, filter, value.provider),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [models, filter, value.provider],
  );

  // 当前选中的 model 若被 filter 滤掉(或已不在列表中) → 自动切到第一个可见。
  useEffect(() => {
    if (value.provider === "custom" || visibleModels.length === 0) return;
    if (value.model && visibleModels.some((m) => m.id === value.model)) return;
    const first = visibleModels[0]!.id;
    if (value.model !== first) set({ model: first });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleModels, value.provider]);

  // 模型列表:缓存(24h) → /api/models 动态拉取 → 静态备选。
  useEffect(() => {
    const provider = value.provider;
    const statics = staticModelEntries(STATIC_MODELS[provider] ?? []);
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
        // 取当前 provider 名下的 key(没填 → 不带头,不拿别的 provider 的 key 顶替)。
        const k = (value.keys[value.provider] ?? "").trim();
        if (k) headers["X-AI-Key"] = k;
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
    const first = filterModels(staticModelEntries(STATIC_MODELS[p] ?? []), filter, p)[0]?.id ?? "";
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
    <>
      <h1 className="large">{t("settings.title")}</h1>
      <p className="lede">{t("settings.modelLabel")}</p>

      <h2 className="group-title">{t("settings.provider")}</h2>
      {/* filter chips */}
      <div className="strip" role="group" aria-label="provider filter">
        {FILTER_ORDER.map((f) => (
          <button
            key={f}
            type="button"
            className={`chip${filter === f ? " on" : ""}`}
            aria-pressed={filter === f}
            onClick={() => selectFilter(f)}
          >
            {t(FILTER_LABEL_KEYS[f])}
          </button>
        ))}
      </div>

      {/* provider tabs:只显示短名 */}
      <div className="strip" role="tablist" aria-label="provider" style={{ marginTop: 8 }}>
        {visible.map((p) => (
          <button
            key={p.name}
            type="button"
            role="tab"
            aria-selected={value.provider === p.name}
            className={`chip${value.provider === p.name ? " on" : ""}`}
            onClick={() => selectProvider(p.name)}
          >
            {t(p.shortKey)}
          </button>
        ))}
      </div>

      {/* 属性面板:选中 provider 的结构化属性 + key + 模型 */}
      <div className="list prov-card">
        <div className="row plain">
          <span className="lbl">{t("settings.apiKey")}</span>
          <span className={`badge ${meta.needsKey ? "badge-warn" : "badge-ok"}`}>
            {meta.needsKey ? t("settings.prop.needKey") : t("settings.prop.noKey")}
          </span>
        </div>
        <div className="row plain">
          <span className="lbl">{t("settings.prop.cost")}</span>
          <span className="badge">{t(COST_LABEL_KEYS[meta.cost])}</span>
        </div>

        {meta.needsKey || meta.optionalKey ? (
          <label className="row plain" htmlFor="key">
            <Icon name="key" className="ic" />
            <input
              id="key"
              type="password"
              autoComplete="off"
              placeholder={t("settings.apiKeyPh")}
              aria-label={t("settings.apiKey")}
              // 每个 provider 各记各的 key;没填过 → 显示为空,绝不显示别的 provider 的 key。
              value={value.keys[value.provider] ?? ""}
              onChange={(e) => set({ keys: { ...value.keys, [value.provider]: e.target.value } })}
            />
            {meta.signup ? (
              <a className="row-link" href={meta.signup} target="_blank" rel="noreferrer">
                {t("settings.apply")}
              </a>
            ) : null}
          </label>
        ) : null}

        {value.provider === "custom" ? (
          <>
            <label className="row plain stack" htmlFor="base">
              <span className="lbl">{t("settings.baseUrl")}</span>
              <input
                id="base"
                type="text"
                placeholder="https://.../v1"
                value={value.baseURL}
                onChange={(e) => set({ baseURL: e.target.value })}
              />
            </label>
            <label className="row plain stack" htmlFor="model">
              <span className="lbl">{t("settings.modelName")}</span>
              <input
                id="model"
                type="text"
                placeholder={t("settings.modelNamePh")}
                value={value.model}
                onChange={(e) => set({ model: e.target.value })}
              />
            </label>
          </>
        ) : visibleModels.length > 0 ? (
          <label className="row plain stack" htmlFor="model2">
            <span className="lbl">
              {t("settings.model")}
              <span className="sub">{sourceLabel}</span>
            </span>
            <select
              id="model2"
              value={value.model || visibleModels[0]!.id}
              onChange={(e) => set({ model: e.target.value })}
            >
              {visibleModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {modelLabel(m)}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
      <p className="note">{t(meta.noteKey)}</p>

      {/* 自定义 AI 人设 / 系统提示:空 = 用默认;非空则追加为 system 末块,优先级最高 */}
      <div className="group-head">
        <h2 className="group-title"><label htmlFor="persona">{t("settings.personaLabel")}</label></h2>
        <button type="button" className="text-btn" onClick={() => set({ systemPrompt: "" })}>
          {t("settings.personaReset")}
        </button>
      </div>
      <textarea
        id="persona"
        className="prompt"
        rows={4}
        placeholder={t("settings.personaPh")}
        value={value.systemPrompt}
        onChange={(e) => set({ systemPrompt: e.target.value })}
      />

      <p className="note">
        {t("settings.noteA")}
        <b>{t("settings.noteB")}</b>
        {t("settings.noteC")}
      </p>

      <h2 className="group-title">{t("settings.general")}</h2>
      <div className="list">
        <div className="row">
          <Icon name="lang" className="ic" />
          <span className="lbl">{t("settings.language")}</span>
          <LocaleSwitch />
        </div>
        <button type="button" className="row" onClick={() => go("history")}>
          <Icon name="history" className="ic" />
          <span className="lbl">{t("history.title")}</span>
          <Icon name="chev" small className="chev" />
        </button>
      </div>
    </>
  );
}
