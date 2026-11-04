export interface AiSettings {
  provider: string;
  /**
   * 每個 provider 各自記住的 key(provider 名 → key)。
   * 某 provider 沒填過 → 對應輸入框顯示為空,絕不拿別的 provider 的 key 頂替。
   */
  keys: Record<string, string>;
  model: string;
  baseURL: string;
  /** 自定義 AI 人設 / 系統提示;空字符串 = 用默認。 */
  systemPrompt: string;
  /** @deprecated 舊版單 key 字段,僅遷移時讀取,保存時丟棄。 */
  apiKey?: string;
}

export const DEFAULT_AI: AiSettings = {
  provider: "workers-ai",
  keys: {},
  model: "",
  baseURL: "",
  systemPrompt: "",
};

const LS_KEY = "mingli.ai.v1";

/**
 * saveAi 成功後派發嘅 window 事件;AiModelNote 等 UI 即時更新,唔使 refresh。
 * 同 tab 內 storage 事件唔會觸發,所以要自己派。
 */
export const AI_SETTINGS_EVENT = "ai-settings-changed";

/**
 * MLX 停用(2026-11-02)後的模型救濟:已存設置若選中 mlx-community/* 模型 id,
 * 映射到 Ollama 同級模型;未知的 mlx-community/* → mac-llm 默認推薦(qwen3:30b)。
 * 只在 Mac provider 下由 migrateAiSettings 調用,其它 provider 的 model 不受影響。
 */
const MLX_MODEL_RESCUE: Record<string, string> = {
  "mlx-community/qwen3-14b-4bit": "qwen3:14b",
  "mlx-community/gpt-oss-20b-mxfp4-q8": "gpt-oss:20b",
};

/** 把已退役的 MLX 模型 id 映射到 Ollama 同級;非 MLX id 原樣返回。 */
export function rescueMacModel(model: string): string {
  const m = model.trim();
  const hit = MLX_MODEL_RESCUE[m.toLowerCase()];
  if (hit) return hit;
  if (m.toLowerCase().startsWith("mlx-community/")) return "qwen3:30b";
  return model;
}

/**
 * 純函數:把 localStorage 裡讀到的舊對象遷移到新結構(不碰 window,可測試)。
 * - 舊版單 `apiKey` 非空 且 新版 `keys` 為空 → 歸到當時選中的 provider 名下。
 * - provider="mac-mlx"(已退役的舊名)→ 映射到 "mac-llm"。
 * - Mac provider 下選了 mlx-community/* 模型 → 救濟映射到 Ollama 同級
 *   (見 rescueMacModel;MLX 已停用,原樣保留會打到死端點)。
 */
export function migrateAiSettings(raw: unknown): AiSettings {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_AI };
  const r = raw as Record<string, unknown>;
  const out: AiSettings = {
    provider: typeof r.provider === "string" && r.provider ? r.provider : DEFAULT_AI.provider,
    keys: {},
    model: typeof r.model === "string" ? r.model : "",
    baseURL: typeof r.baseURL === "string" ? r.baseURL : "",
    systemPrompt: typeof r.systemPrompt === "string" ? r.systemPrompt : "",
  };
  if (out.provider.trim().toLowerCase() === "mac-mlx") out.provider = "mac-llm";
  if (out.provider === "mac-llm" && out.model) out.model = rescueMacModel(out.model);
  if (r.keys && typeof r.keys === "object") {
    for (const [k, v] of Object.entries(r.keys as Record<string, unknown>)) {
      if (typeof k === "string" && typeof v === "string" && v.trim()) out.keys[k] = v.trim();
    }
  }
  if (Object.keys(out.keys).length === 0 && typeof r.apiKey === "string" && r.apiKey.trim()) {
    out.keys[out.provider] = r.apiKey.trim();
  }
  return out;
}

/** 讀取瀏覽器裡保存的 AI 設置(隨請求發送,服務端不保存)。 */
export function loadAi(): AiSettings {
  if (typeof window === "undefined") return { ...DEFAULT_AI };
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (raw) return migrateAiSettings(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_AI };
}

export function saveAi(s: AiSettings): void {
  try {
    // 丟棄舊版 apiKey 字段,只存新結構。
    const { apiKey: _drop, ...rest } = s;
    void _drop;
    window.localStorage.setItem(LS_KEY, JSON.stringify(rest));
    window.dispatchEvent(new Event(AI_SETTINGS_EVENT));
  } catch {
    /* ignore */
  }
}

/** 當前 provider 的 key;沒填過 → 空字符串(絕不拿別的 provider 的 key 頂替)。 */
export function currentKey(s: AiSettings): string {
  return (s.keys[s.provider] ?? "").trim();
}

/**
 * 組裝發往 API 的請求體片段。
 * - `ai`:BYOK(provider/key/model/baseURL),key 取當前 provider 名下的,沒填則省略。
 * - `systemPrompt`:頂層字段(與 locale 同級),為空則省略 → 服務端用默認。
 */
export function aiRequestParts(): {
  ai: { provider: string; apiKey?: string; model?: string; baseURL?: string };
  systemPrompt?: string;
} {
  const s = loadAi();
  const key = currentKey(s);
  const model = s.model.trim();
  const baseURL = s.baseURL.trim();
  const sp = s.systemPrompt.trim();
  return {
    ai: {
      provider: s.provider,
      ...(key ? { apiKey: key } : {}),
      ...(model ? { model } : {}),
      ...(baseURL ? { baseURL } : {}),
    },
    ...(sp ? { systemPrompt: sp } : {}),
  };
}
