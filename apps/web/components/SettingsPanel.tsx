"use client";

import { useEffect, useMemo, useState } from "react";
import { type AiSettings, DEFAULT_AI, loadAi, saveAi, AI_SETTINGS_EVENT } from "@/lib/aiSettings";
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
  filterRetired,
  isMacProvider,
  isRecommended,
  staticModelEntries,
  type ProviderFilter,
} from "@/lib/providerMeta";
import { readModelsCache, writeModelsCache } from "@/lib/modelsCache";

interface ModelOption {
  id: string;
  free?: boolean;
}

const FILTER_ORDER: ProviderFilter[] = ["all", "nokey", "free", "paid", "recommended"];

export function SettingsPanel() {
  const { t } = useLocale();
  const [value, setValue] = useState<AiSettings>(DEFAULT_AI);
  const [filter, setFilter] = useState<ProviderFilter>("all");
  const [models, setModels] = useState<ModelOption[]>([]);
  const [modelsSource, setModelsSource] = useState<string>("static");
  /** models 呢個列表屬於邊個 provider(同 models 一齊更新,唔好分開)。 */
  const [modelsProvider, setModelsProvider] = useState<string>("");

  // SettingsPanel 成日 mount 住(切 screen 只係隱藏),經 pills 改完設定要即時跟到,
  // 否則設定頁顯示舊值,一改嘢就會用舊值覆寫 pills 嘅改動。
  useEffect(() => {
    setValue(loadAi());
    const refresh = () => setValue(loadAi());
    window.addEventListener(AI_SETTINGS_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(AI_SETTINGS_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  // 頂部 filter 同時是模型 filter:免費/付費作用於模型下拉;推薦只留實測可用的高性價比模型。
  // 推薦模型置頂:長列表裡好用的先看到,其餘原序在後(不移除任何選項,不觸發自動切換)。
  const visibleModels = useMemo(
    () =>
      [...filterModels(models, filter, value.provider)].sort(
        (a, b) =>
          Number(isRecommended(value.provider, b.id)) - Number(isRecommended(value.provider, a.id)),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [models, filter, value.provider],
  );

  // 當前選中的 model 若被 filter 濾掉(或已不在列表中) → 自動切到第一個可見。
  // 注意:SettingsPanel 成日 mount 住,reload 時 value 先由 DEFAULT_AI 載入真值,
  // models 有一 render 仲係舊 provider 嘅表——唔對齊就唔好判斷,否則會誤殺
  // 用戶啱啱經 pills 揀好嘅 model(先錯切去舊 provider 首個,再錯切去新 provider 首個)。
  useEffect(() => {
    if (value.provider === "custom" || visibleModels.length === 0) return;
    if (modelsProvider !== value.provider) return;
    if (value.model && visibleModels.some((m) => m.id === value.model)) return;
    const first = visibleModels[0]!.id;
    if (value.model !== first) set({ model: first });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleModels, value.provider, modelsProvider]);

  // 模型列表:緩存 → /api/models 動態拉取 → 靜態備選。
  // Mac provider 緩存 TTL 只有 60s,且即使有緩存都 background revalidate(SWR),保持即時。
  useEffect(() => {
    const provider = value.provider;
    const statics = staticModelEntries(STATIC_MODELS[provider] ?? []);
    const cached = readModelsCache(provider);
    const isMac = isMacProvider(provider);
    if (cached && cached.models.length > 0) {
      // 舊緩存可能含已下架模型,讀出即過濾(下次拉取後緩存自然乾淨)。
      setModels(filterRetired(cached.models));
      setModelsSource(cached.source);
      setModelsProvider(provider);
      if (!isMac) return;
    } else {
      setModels(statics);
      setModelsSource("static");
      setModelsProvider(provider);
    }
    let cancelled = false;
    (async () => {
      try {
        const headers: Record<string, string> = {};
        // 取當前 provider 名下的 key(沒填 → 不帶頭,不拿別的 provider 的 key 頂替)。
        const k = (value.keys[value.provider] ?? "").trim();
        if (k) headers["X-AI-Key"] = k;
        const res = await fetch(`/api/models?provider=${encodeURIComponent(provider)}`, {
          headers,
          ...(isMac ? { cache: "no-store" as const } : {}),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { models?: ModelOption[]; source?: string; offline?: boolean };
        if (cancelled || !Array.isArray(data.models) || data.models.length === 0) return;
        setModels(data.models);
        const src = data.offline
          ? "offline"
          : data.source === "live"
            ? "live"
            : data.source === "verified-static"
              ? "verified-static"
              : "static";
        setModelsSource(src);
        setModelsProvider(provider);
        writeModelsCache(provider, data.models, src === "offline" ? "static" : src);
      } catch {
        /* 保持靜態備選 */
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
    // filter 後當前 provider 不可見 → 自動選中第一個可見的(保持 tab 恆有一選中)。
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
      : modelsSource === "offline"
        ? t("settings.models.offline")
        : modelsSource === "verified-static"
          ? t("settings.models.verified")
          : t("settings.models.static");

  return (
    <>
      <h1 className="large">{t("settings.title")}</h1>
      <p className="lede">{t("settings.modelLabel")}</p>

      <h2 className="group-title">{t("settings.provider")}</h2>
      {/* filter chips */}
      <div className="strip" role="group" aria-label={t("settings.providerFilter")}>
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

      {/* provider tabs:只顯示短名 */}
      <div className="strip" role="group" aria-label={t("settings.provider")} style={{ marginTop: 8 }}>
        {visible.map((p) => (
          <button
            key={p.name}
            type="button"
            aria-pressed={value.provider === p.name}
            className={`chip${value.provider === p.name ? " on" : ""}`}
            onClick={() => selectProvider(p.name)}
          >
            {t(p.shortKey)}
          </button>
        ))}
      </div>

      {/* 屬性面板:選中 provider 的結構化屬性 + key + 模型 */}
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
              // 每個 provider 各記各的 key;沒填過 → 顯示為空,絕不顯示別的 provider 的 key。
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

      {/* 自定義 AI 人設 / 系統提示:空 = 用默認;非空則追加為 system 末塊,優先級最高 */}
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
