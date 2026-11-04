import { test } from "node:test";
import assert from "node:assert/strict";
import { sectionBasis, tenGodHits } from "../test-dist/basis.js";
import { castChart } from "@numerology/engine";

// 1990-02-15 23:00 男:日主辛、官祿武曲/天府、財帛紫微/天相、夫妻七殺、日支亥、調候己壬庚(窮通寶鑑)。
const chart = castChart({ year: 1990, month: 2, day: 15, hour: 23, minute: 0, gender: "男" });

test("basis:每節依據直接取自命盤", () => {
  const b = sectionBasis(chart, 2026);
  assert.equal(b.personality[0].value, "辛");
  assert.equal(b.career[0].value, "武曲、天府");
  assert.equal(b.wealth[0].value, "紫微、天相");
  assert.equal(b.relationship[0].value, "七杀");
  assert.equal(b.relationship[1].value, "亥");
  assert.equal(b.advice[0].value, "己、壬、庚");
  assert.equal(b.advice[0].source, "窮通寶鑑");
  assert.ok(b.luck[0].value.length === 2);
});

test("basis:十神命中位置含天干同藏干,日干唔計", () => {
  const hits = tenGodHits(chart, ["正官", "七杀"]);
  assert.deepEqual(hits.map((h) => `${h.pillar}.${h.part}:${h.god}`), ["year.zhi:七杀", "month.zhi:正官"]);
  assert.equal(tenGodHits(chart, ["比肩"]).length, 0);
});

test("basis:crosssystem 依據 = 各體系值與五行", async () => {
  const { castCrossSystem } = await import("@numerology/engine");
  const b = sectionBasis(chart, 2026).crosssystem;
  const sig = castCrossSystem(chart).signals;
  assert.equal(b.length, sig.length);
  assert.deepEqual(b.map((f) => [f.label.system, f.value, f.vars.wuxing]), sig.map((s) => [s.system, s.value, s.wuxing]));
  assert.equal(b.find((f) => f.label.system === "lifepath").vars.bridge, "河圖");
});
