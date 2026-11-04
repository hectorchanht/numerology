import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BUDGET_USD_PER_MONTH,
  USD_PER_1K_NEURONS,
  BUDGET_NEURONS,
  budgetMonthKey,
  BudgetExceededError,
  checkBudget,
  recordUsage,
} from "../dist/budget.js";

/** 內存 KV,模擬 Cloudflare KV binding 的 get/put 子集。 */
function memKv(seed = {}) {
  const m = new Map(Object.entries(seed));
  return {
    get: async (k) => (m.has(k) ? m.get(k) : null),
    put: async (k, v) => { m.set(k, v); },
    _map: m,
  };
}

// —— 預算數學 ——
test("budget:$2 上限换算为 181818 neurons", () => {
  assert.equal(BUDGET_USD_PER_MONTH, 2);
  assert.equal(USD_PER_1K_NEURONS, 0.011);
  assert.equal(BUDGET_NEURONS, 181818);
  assert.equal(BUDGET_NEURONS, Math.floor((2 / 0.011) * 1000));
});

// —— 月份 key 按 UTC 滾動 ——
test("budget:月份 key 为 UTC 年月,跨月滚动", () => {
  assert.equal(budgetMonthKey(new Date("2026-10-22T10:00:00Z")), "ai-budget:2026-10");
  assert.equal(budgetMonthKey(new Date("2026-10-31T23:59:59Z")), "ai-budget:2026-10");
  assert.equal(budgetMonthKey(new Date("2026-11-01T00:00:00Z")), "ai-budget:2026-11");
  // UTC 邊界:東八區已是 11 月 1 日 08:00,UTC 仍是 10 月
  assert.equal(budgetMonthKey(new Date("2026-11-01T00:30:00+08:00")), "ai-budget:2026-10");
});

// —— 檢查與記賬 ——
test("budget:未超支时 checkBudget 返回累计,不抛错", async () => {
  const kv = memKv({ "ai-budget:2026-10": "1000" });
  const total = await checkBudget(kv, new Date("2026-10-15T00:00:00Z"));
  assert.equal(total, 1000);
});

test("budget:空 KV 从 0 开始", async () => {
  const kv = memKv();
  assert.equal(await checkBudget(kv, new Date("2026-10-15T00:00:00Z")), 0);
  const next = await recordUsage(kv, 2.5, new Date("2026-10-15T00:00:00Z"));
  assert.equal(next, 2.5);
  assert.equal(await checkBudget(kv, new Date("2026-10-15T00:00:00Z")), 2.5);
});

test("budget:累计记账,非法 neurons 按 0 计", async () => {
  const kv = memKv();
  const d = new Date("2026-10-15T00:00:00Z");
  await recordUsage(kv, 100, d);
  await recordUsage(kv, NaN, d);
  await recordUsage(kv, -5, d);
  assert.equal(await checkBudget(kv, d), 100);
});

test("budget:达到上限抛 BudgetExceededError(带固定标记)", async () => {
  const kv = memKv({ "ai-budget:2026-10": String(BUDGET_NEURONS) });
  await assert.rejects(
    checkBudget(kv, new Date("2026-10-15T00:00:00Z")),
    (err) => {
      assert.ok(err instanceof BudgetExceededError);
      assert.match(err.message, /AI_BUDGET_EXCEEDED/);
      assert.match(err.message, /\$2/);
      return true;
    },
  );
});

test("budget:超支一个 neurons 也拒绝", async () => {
  const kv = memKv({ "ai-budget:2026-10": String(BUDGET_NEURONS - 0.5) });
  // 未達上限:通過
  await checkBudget(kv, new Date("2026-10-15T00:00:00Z"));
  await recordUsage(kv, 1, new Date("2026-10-15T00:00:00Z"));
  // 已達上限:拒絕
  await assert.rejects(checkBudget(kv, new Date("2026-10-15T00:00:00Z")), BudgetExceededError);
});

test("budget:跨月计数隔离", async () => {
  const kv = memKv({ "ai-budget:2026-10": String(BUDGET_NEURONS) });
  // 10 月已滿,11 月從 0 開始
  assert.equal(await checkBudget(kv, new Date("2026-11-02T00:00:00Z")), 0);
});
