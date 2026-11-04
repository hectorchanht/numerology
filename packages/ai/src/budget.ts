/**
 * Workers AI 用量預算守衛:每月硬上限 $2。
 *
 * 背景:Workers AI 沒有原生的月度 spending cap,超量只會計費($0.011 / 1K neurons)。
 * 這裡在應用層強制執行:每次調用前後經 KV 讀寫當月(UTC)累計 neurons,
 * 達到上限即拒絕(429),絕不超支。
 *
 * 保守口徑:所有 neurons 都計入 $2(包含每日免費的 10,000 neurons)。
 * 因此實際賬單恆為 $0 —— 上限(約 181,818 neurons/月)遠低於免費額度總量
 * (10,000/天 ≈ 300,000/月),到上限即停,不會產生任何付費用量。
 * KV 為最終一致性,併發請求可能有輕微超調(文檔見 NOTES.md),可接受。
 */

/** 每月預算(美元,用戶設定,硬上限)。 */
export const BUDGET_USD_PER_MONTH = 2;
/** Workers AI 計價:$0.011 / 1,000 neurons(官方定價,見 NOTES.md)。 */
export const USD_PER_1K_NEURONS = 0.011;
/** 換算後的每月 neuron 上限(向下取整)。 */
export const BUDGET_NEURONS = Math.floor((BUDGET_USD_PER_MONTH / USD_PER_1K_NEURONS) * 1000);

/** KV 的最小接口子集(Cloudflare KV binding 天然滿足;測試可用內存實現)。 */
export interface BudgetKV {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<unknown>;
}

/** 當月(UTC)的計數 key,如 "ai-budget:2026-10"。月份按 UTC 邊界滾動。 */
export function budgetMonthKey(d: Date = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `ai-budget:${y}-${m}`;
}

/** 預算耗盡時拋出的錯誤;http.ts 將其分類為 429(消息含固定標記,勿改)。 */
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
 * 調用前檢查:返回當前累計;若已達上限則拋 BudgetExceededError。
 * 必須在每次 Workers AI 調用前執行(流式為懶啟動,放在 run() 內首行)。
 */
export async function checkBudget(kv: BudgetKV, now: Date = new Date()): Promise<number> {
  const total = await readTotal(kv, budgetMonthKey(now));
  if (total >= BUDGET_NEURONS) throw new BudgetExceededError(total);
  return total;
}

/** 調用後記賬:累加本次 neurons,返回新的累計值。 */
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
