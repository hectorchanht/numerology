import { test } from "node:test";
import assert from "node:assert/strict";
import { atLeastOneProb, binomialDist, simulate } from "../test-dist/baseRate.js";

test("atLeastOneProb(4,5) = 1 − 0.8⁴ = 0.5904", () => {
  assert.ok(Math.abs(atLeastOneProb(4, 5) - 0.5904) < 1e-9);
});

test("binomialDist 總和 = 1,且 j≥1 之和 = atLeastOneProb", () => {
  for (const [k, m] of [[2, 2], [4, 5], [6, 12]]) {
    const d = binomialDist(k, m);
    assert.equal(d.length, k + 1);
    assert.ok(Math.abs(d.reduce((a, b) => a + b, 0) - 1) < 1e-12);
    assert.ok(Math.abs(1 - d[0] - atLeastOneProb(k, m)) < 1e-12);
  }
});

test("simulate:固定種子可重現,且與解析解各項差 < 0.02", () => {
  assert.deepEqual(simulate(4, 5, 10000, 1), simulate(4, 5, 10000, 1));
  for (const [k, m] of [[4, 5], [2, 2], [6, 12]]) {
    const s = simulate(k, m, 10000, 1);
    const d = binomialDist(k, m);
    assert.equal(s.length, k + 1);
    s.forEach((p, j) => assert.ok(Math.abs(p - d[j]) < 0.02, `k=${k} m=${m} j=${j}: ${p} vs ${d[j]}`));
  }
});
