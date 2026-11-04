/**
 * 動態下架模型登記:生成時撞到 404(模型不存在/已下架)即寫入 KV,
 * 模型列表拉取時自動濾走 —— 不靠人手維護 hardcode 表。
 *
 * 存儲:單條 KV(JSON),按 provider 分組,值為首次探到 404 的時間戳。
 * TTL 30 天:過期條目自動復活(模型有可能重新上架,復活後若再 404 會重新登記)。
 * hardcode 的 RETIRED_MODEL_IDS(web 側 providerMeta)仍保留作 seed,兩者取並集過濾。
 */

import type { BudgetKV } from "./budget.js";

/** KV 中登記表的 key。 */
export const DEAD_MODELS_KV_KEY = "ai-dead-models:v1";
/** 登記有效期:30 天。 */
export const DEAD_MODELS_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface DeadModelMap {
  [provider: string]: { [model: string]: number };
}

/** 歸一化模型 id:與 web 側 normModelId 一致,剝掉 Gemini 的 `models/` 前綴。 */
export function normDeadModelId(id: string): string {
  return id.startsWith("models/") ? id.slice("models/".length) : id;
}

function validKVRead(kv: unknown): kv is BudgetKV {
  return !!kv && typeof (kv as BudgetKV).get === "function";
}

function validKVWrite(kv: unknown): kv is BudgetKV {
  return validKVRead(kv) && typeof (kv as BudgetKV).put === "function";
}

async function readMap(kv: BudgetKV): Promise<DeadModelMap> {
  try {
    const raw = await kv.get(DEAD_MODELS_KV_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as DeadModelMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * 登記一個下架模型。絕不拋錯 —— 登記失敗不能掩蓋調用方真正的生成錯誤,
 * 調用方仍需照常拋/回落。
 */
export async function recordDeadModel(
  kv: unknown,
  provider: string,
  modelId: string,
): Promise<void> {
  if (!validKVWrite(kv) || !provider || !modelId) return;
  try {
    const map = await readMap(kv);
    const group = (map[provider] ??= {});
    group[normDeadModelId(modelId)] = Date.now();
    await kv.put(DEAD_MODELS_KV_KEY, JSON.stringify(map));
  } catch {
    /* ignore:登記是 best-effort */
  }
}

/** 讀出登記表(供模型列表過濾用);kv 缺失或損壞時返回空表。 */
export async function readDeadModels(kv: unknown): Promise<DeadModelMap> {
  if (!validKVRead(kv)) return {};
  return readMap(kv);
}

/** 某 provider 下仍在有效期內的下架模型 id 集合(已歸一化)。 */
export function deadModelIds(
  map: DeadModelMap,
  provider: string,
  now: number = Date.now(),
): Set<string> {
  const out = new Set<string>();
  const group = map[provider];
  if (!group) return out;
  for (const [id, ts] of Object.entries(group)) {
    if (typeof ts === "number" && now - ts < DEAD_MODELS_TTL_MS) out.add(id);
  }
  return out;
}
