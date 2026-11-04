import { test } from "node:test";
import assert from "node:assert/strict";
import { castChart, castCrossSystem, wuxingRelation } from "../dist/index.js";

const SAMPLE = { year: 1990, month: 3, day: 18, hour: 9, minute: 30, gender: "男" };

test("wuxingRelation", () => {
  assert.equal(wuxingRelation("火", "火"), "same");
  assert.equal(wuxingRelation("木", "火"), "sheng");
  assert.equal(wuxingRelation("火", "木"), "sheng");
  assert.equal(wuxingRelation("水", "火"), "ke");
  assert.equal(wuxingRelation("火", "水"), "ke");
  assert.equal(wuxingRelation("土", "金"), "sheng");
  assert.equal(wuxingRelation("木", "土"), "ke");
});
test("castCrossSystem", () => {
  const chart = castChart(SAMPLE);
  const r = castCrossSystem(chart);
  assert.deepEqual(r.signals.map((s) => s.system), ["bazi", "ziwei", "ninestar", "lifepath"]);
  const [b, z, n, l] = r.signals;
  assert.equal(b.relation, undefined);
  assert.equal(l.bridge, "河圖"); assert.equal(l.wuxing, "金");
  assert.equal(n.wuxing, "水");
  assert.equal(z.value, chart.ziwei.fiveElementsClass);
  assert.equal(z.wuxing, chart.ziwei.fiveElementsClass[0]);
  assert.equal(Object.values(r.distribution).reduce((a, c) => a + c, 0), r.signals.length);
  for (const s of r.signals) { assert.ok(s.steps.length > 0); assert.ok(s.cite.work); }
  assert.ok(r.kamea.marks.length > 0);
});
test("empty fiveElementsClass", () => {
  const c = castChart(SAMPLE);
  const r = castCrossSystem({ ...c, ziwei: { ...c.ziwei, fiveElementsClass: "" } });
  assert.deepEqual(r.signals.map((s) => s.system), ["bazi", "ninestar", "lifepath"]);
});
test("lifepath disagreement", () => {
  const c = castChart({ ...SAMPLE, year: 2009, month: 11, day: 29 });
  const l = castCrossSystem(c).signals.find((s) => s.system === "lifepath");
  assert.equal(l.value, "33(全數字法 6)");
  assert.ok(l.steps.some((s) => s.includes("算法分歧")));
});
test("第二軸:fit 依扶抑喜忌", () => {
  const r = castCrossSystem(castChart(SAMPLE));
  assert.ok(r.fuyi && typeof r.fuyi.score === "number");
  assert.equal(r.signals[0].fit, undefined);
  for (const s of r.signals.slice(1)) {
    const want = r.fuyi.favorable.includes(s.wuxing) ? "favorable"
      : r.fuyi.unfavorable.includes(s.wuxing) ? "unfavorable" : "neutral";
    assert.equal(s.fit, want);
    assert.ok(s.steps.some((t) => t.includes("2/5") && t.includes("3/5")));
  }
});
test("第二軸:中和盤全部 neutral", () => {
  // 1980-04-05 13:00 扶抑總分 0(見 fuyi.test.mjs)
  const r = castCrossSystem(castChart({ year: 1980, month: 4, day: 5, hour: 13, minute: 0, gender: "男" }));
  assert.equal(r.fuyi.verdict, "neutral");
  for (const s of r.signals.slice(1)) assert.equal(s.fit, "neutral");
});
