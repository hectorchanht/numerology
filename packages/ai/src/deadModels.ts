/**
 * 动态下架模型登记:生成时撞到 404(模型不存在/已下架)即写入 KV,
 * 模型列表拉取时自动滤走 —— 不靠人手维护 hardcode 表。
 *
 * 存储:单条 KV(JSON),按 provider 分组,值为首次探到 404 的时间戳。
 * TTL 30 天:过期条目自动复活(模型有可能重新上架,复活后若再 404 会重新登记)。
 * hardcode 的 RETIRED_MODEL_IDS(web 侧 providerMeta)仍保留作 seed,两者取并集过滤。
 */

import type { BudgetKV } from "./budget.js";

/** KV 中登记表的 key。 */
export const DEAD_MODELS_KV_KEY = "ai-dead-models:v1";
/** 登记有效期:30 天。 */
export const DEAD_MODELS_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface DeadModelMap {
  [provider: string]: { [model: string]: number };
}

/** 归一化模型 id:与 web 侧 normModelId 一致,剥掉 Gemini 的 `models/` 前缀。 */
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
 * 登记一个下架模型。绝不抛错 —— 登记失败不能掩盖调用方真正的生成错误,
 * 调用方仍需照常抛/回落。
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
    /* ignore:登记是 best-effort */
  }
}

/** 读出登记表(供模型列表过滤用);kv 缺失或损坏时返回空表。 */
export async function readDeadModels(kv: unknown): Promise<DeadModelMap> {
  if (!validKVRead(kv)) return {};
  return readMap(kv);
}

/** 某 provider 下仍在有效期内的下架模型 id 集合(已归一化)。 */
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
