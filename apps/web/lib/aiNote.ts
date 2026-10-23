import { currentKey, type AiSettings } from "./aiSettings.js";
import { PROVIDER_META } from "./providerMeta.js";

/**
 * AI 按鈕旁邊嘅 dimmed 註腳:而家用緊邊個 model + key 狀態。
 * 純函數(唔掂 i18n),方便測試;UI 層係 components/AiModelNote.tsx。
 * Hector 2026-10-23:唔提 $2 預算、唔提經本站 Cloudflare 帳號——
 * 用戶只需要知「本站免費 AI 有限額」。
 */

/** 模型 id 縮短顯示:去 prefix(@cf/org/)同常見後綴(由尾向前逐個去)。 */
export function shortModelName(id: string): string {
  const base = id.includes("/") ? id.slice(id.lastIndexOf("/") + 1) : id;
  return base.replace(/-fp8-fast$/, "").replace(/-instruct$/, "");
}

export interface AiNoteLabels {
  /** 本站提供的免費 AI(有限額) */
  siteFree: string;
  /** 免費(第三方免 key) */
  free: string;
  /** 你的 key */
  yourKey: string;
  /** 未填 key */
  noKey: string;
  /** 預設(跟喺 provider 名後面) */
  defaultSuffix: string;
}

/**
 * 組出註腳文字:`{model} · {來源}`。
 * - model:有填就用填嘅(縮短);冇填就 `{providerLabel}{defaultSuffix}`。
 * - 來源:有 key → yourKey;provider 要 key 但未填 → noKey;
 *   workers-ai(本站) → siteFree;其他免 key → free。
 */
export function aiNoteText(s: AiSettings, labels: AiNoteLabels, providerLabel: string): string {
  const model = s.model.trim();
  const meta = PROVIDER_META.find((p) => p.name === s.provider);
  const keyed = currentKey(s) !== "";
  const modelPart = model ? shortModelName(model) : `${providerLabel}${labels.defaultSuffix}`;
  let sourcePart: string;
  if (keyed) {
    sourcePart = labels.yourKey;
  } else if (meta?.needsKey) {
    sourcePart = labels.noKey;
  } else {
    sourcePart = s.provider === "workers-ai" ? labels.siteFree : labels.free;
  }
  return `${modelPart} · ${sourcePart}`;
}
