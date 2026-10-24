/**
 * 模型列表的浏览器缓存(24h):SettingsPanel 写入/读取,
 * 生成时撞到 MODEL_NOT_FOUND(模型下架)则由 StreamedReport 清空,
 * 使下次打开设置时立即重新拉取(已滤走下架模型),无需等缓存过期。
 */

export interface CachedModels {
  models: { id: string; free?: boolean }[];
  source: string;
}

const MODELS_CACHE_PREFIX = "numerology-models-";
const MODELS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export function readModelsCache(provider: string): CachedModels | null {
  try {
    const raw = window.localStorage.getItem(MODELS_CACHE_PREFIX + provider);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; models: CachedModels["models"]; source: string };
    if (Date.now() - parsed.at > MODELS_CACHE_TTL_MS) return null;
    return { models: parsed.models, source: parsed.source };
  } catch {
    return null;
  }
}

export function writeModelsCache(
  provider: string,
  models: CachedModels["models"],
  source: string,
): void {
  try {
    window.localStorage.setItem(
      MODELS_CACHE_PREFIX + provider,
      JSON.stringify({ at: Date.now(), models, source }),
    );
  } catch {
    /* ignore */
  }
}

/** 清空全部 provider 的模型缓存(下次打开设置时重新拉取,已滤走下架模型)。 */
export function clearModelsCache(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(MODELS_CACHE_PREFIX)) keys.push(k);
    }
    for (const k of keys) window.localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
}
