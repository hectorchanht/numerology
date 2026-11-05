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
  assert.deepEqual(r.all, [{ op: "inPalace", stars: ["紫微", "天府"], palace: "命宫" }]);
});

test("meta 未校對、JSON 同內聯數據一致", () => {
  assert.equal(M.reviewed, false);
  const json = JSON.parse(readFileSync(new URL("../data/ziwei-geju.json", import.meta.url), "utf8"));
  assert.deepEqual(json.rules, G);
  assert.deepEqual(json.meta, M);
});

test("DSL 擴充:亮度限定、空 stars 限地支", () => {
  const g = (id) => G.find((x) => x.id === id);
  assert.deepEqual(g("riyue-bingming").all[0].brightness, ["庙", "旺"]);
  assert.deepEqual(g("huotan").all[0].brightness, ["庙", "旺"]);
  assert.ok(g("jiyue-tongliang").all.some((c) => c.op === "inPalace" && c.stars.length === 0 && c.branches.join() === "寅,申"));
  assert.equal(g("ming-wu-zhengyao").verdict, "中");
  assert.deepEqual(g("matou-daijian").all[0].stars, ["天同", "擎羊"]);
});
