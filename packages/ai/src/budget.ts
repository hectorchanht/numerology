/**
 * Workers AI 用量预算守卫:每月硬上限 $2。
 *
 * 背景:Workers AI 没有原生的月度 spending cap,超量只会计费($0.011 / 1K neurons)。
 * 这里在应用层强制执行:每次调用前后经 KV 读写当月(UTC)累计 neurons,
 * 达到上限即拒绝(429),绝不超支。
 *
 * 保守口径:所有 neurons 都计入 $2(包含每日免费的 10,000 neurons)。
 * 因此实际账单恒为 $0 —— 上限(约 181,818 neurons/月)远低于免费额度总量
 * (10,000/天 ≈ 300,000/月),到上限即停,不会产生任何付费用量。
 * KV 为最终一致性,并发请求可能有轻微超调(文档见 NOTES.md),可接受。
 */

/** 每月预算(美元,用户设定,硬上限)。 */
export const BUDGET_USD_PER_MONTH = 2;
/** Workers AI 计价:$0.011 / 1,000 neurons(官方定价,见 NOTES.md)。 */
export const USD_PER_1K_NEURONS = 0.011;
/** 换算后的每月 neuron 上限(向下取整)。 */
export const BUDGET_NEURONS = Math.floor((BUDGET_USD_PER_MONTH / USD_PER_1K_NEURONS) * 1000);

/** KV 的最小接口子集(Cloudflare KV binding 天然满足;测试可用内存实现)。 */
export interface BudgetKV {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<unknown>;
}

/** 当月(UTC)的计数 key,如 "ai-budget:2026-10"。月份按 UTC 边界滚动。 */
export function budgetMonthKey(d: Date = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `ai-budget:${y}-${m}`;
}

/** 预算耗尽时抛出的错误;http.ts 将其分类为 429(消息含固定标记,勿改)。 */
export class BudgetExceededError extends Error {
  readonly usedNeurons: number;
  constructor(usedNeurons: number) {
    super(
      `AI_BUDGET_EXCEEDED:本月 Workers AI 用量已達上限($${BUDGET_USD_PER_MONTH},` +
        `已用約 ${Math.round(usedNeurons).toLocaleString("en-US")} neurons),` +
        `請下個月再試,或在 AI 設定中切換其它 provider`,
    );
    this.name = "BudgetExceededError";
    this.usedNeurons = usedNeurons;
  }
}

async function readTotal(kv: BudgetKV, key: string): Promise<number> {
  const raw = await kv.get(key);
  const n = raw === null ? 0 : Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/**
 * 调用前检查:返回当前累计;若已达上限则抛 BudgetExceededError。
 * 必须在每次 Workers AI 调用前执行(流式为懒启动,放在 run() 内首行)。
 */
export async function checkBudget(kv: BudgetKV, now: Date = new Date()): Promise<number> {
  const total = await readTotal(kv, budgetMonthKey(now));
  if (total >= BUDGET_NEURONS) throw new BudgetExceededError(total);
  return total;
}

/** 调用后记账:累加本次 neurons,返回新的累计值。 */
export async function recordUsage(
  kv: BudgetKV,
  neurons: number,
  now: Date = new Date(),
): Promise<number> {
  const key = budgetMonthKey(now);
  const total = await readTotal(kv, key);
  const next = total + (Number.isFinite(neurons) && neurons > 0 ? neurons : 0);
  await kv.put(key, String(next));
  return next;
}
