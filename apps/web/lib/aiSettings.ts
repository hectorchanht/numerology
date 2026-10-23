export interface AiSettings {
  provider: string;
  /**
   * 每个 provider 各自记住的 key(provider 名 → key)。
   * 某 provider 没填过 → 对应输入框显示为空,绝不拿别的 provider 的 key 顶替。
   */
  keys: Record<string, string>;
  model: string;
  baseURL: string;
  /** 自定义 AI 人设 / 系统提示;空字符串 = 用默认。 */
  systemPrompt: string;
  /** @deprecated 旧版单 key 字段,仅迁移时读取,保存时丢弃。 */
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
 * 纯函数:把 localStorage 里读到的旧对象迁移到新结构(不碰 window,可测试)。
 * - 旧版单 `apiKey` 非空 且 新版 `keys` 为空 → 归到当时选中的 provider 名下。
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

/** 读取浏览器里保存的 AI 设置(随请求发送,服务端不保存)。 */
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
    // 丢弃旧版 apiKey 字段,只存新结构。
    const { apiKey: _drop, ...rest } = s;
    void _drop;
    window.localStorage.setItem(LS_KEY, JSON.stringify(rest));
    window.dispatchEvent(new Event(AI_SETTINGS_EVENT));
  } catch {
    /* ignore */
  }
}

/** 当前 provider 的 key;没填过 → 空字符串(绝不拿别的 provider 的 key 顶替)。 */
export function currentKey(s: AiSettings): string {
  return (s.keys[s.provider] ?? "").trim();
}

/**
 * 组装发往 API 的请求体片段。
 * - `ai`:BYOK(provider/key/model/baseURL),key 取当前 provider 名下的,没填则省略。
 * - `systemPrompt`:顶层字段(与 locale 同级),为空则省略 → 服务端用默认。
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
