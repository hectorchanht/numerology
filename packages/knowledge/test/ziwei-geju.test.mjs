import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ZIWEI_GEJU as G, ZIWEI_GEJU_META as M } from "../dist/index.js";

test("格局:條數、id 唯一、cite 非空", () => {
  assert.ok(G.length >= 1);
  assert.equal(new Set(G.map((r) => r.id)).size, G.length);
  for (const r of G) {
    assert.ok(r.all.length >= 1, r.id);
    assert.ok(r.cite.length > 0, r.id);
    assert.ok(["吉", "凶", "中"].includes(r.verdict), r.id);
  }
});

test("紫府同宮條件", () => {
  const r = G.find((x) => x.id === "zifu-tonggong");
  assert.deepEqual(r.all, [{ op: "samePalace", stars: ["紫微", "天府"] }]);
});

test("meta 未校對、JSON 同內聯數據一致", () => {
  assert.equal(M.reviewed, false);
  const json = JSON.parse(readFileSync(new URL("../data/ziwei-geju.json", import.meta.url), "utf8"));
  assert.deepEqual(json.rules, G);
  assert.deepEqual(json.meta, M);
});
