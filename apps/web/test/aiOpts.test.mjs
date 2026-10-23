import { test } from "node:test";
import assert from "node:assert/strict";
import { primeTimeoutMs } from "../test-dist/primeTimeout.js";

// —— workers-ai 冷启动首 token 可能 >20s,预热放宽到 60s ——
test("primeTimeoutMs:workers-ai 放宽到 60s,默认/显式都生效", () => {
  assert.equal(primeTimeoutMs(undefined), 60_000);
  assert.equal(primeTimeoutMs({}), 60_000);
  assert.equal(primeTimeoutMs({ provider: "workers-ai" }), 60_000);
  assert.equal(primeTimeoutMs({ provider: "pollinations" }), 20_000);
  assert.equal(primeTimeoutMs({ provider: "anthropic" }), 20_000);
});
