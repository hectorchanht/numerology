import { test } from "node:test";
import assert from "node:assert/strict";
import { castNineStar } from "../dist/index.js";

test("立春前屬上一年", () => {
  assert.deepEqual(castNineStar({ year: 1990, month: 2, day: 3, hour: 12, gender: "男" }).year,
    { number: 2, name: "二黑", wuxing: "土", gua: "坤", direction: "西南" });
});
test("立春後", () => {
  const y = castNineStar({ year: 1990, month: 2, day: 5, hour: 12, gender: "男" }).year;
  assert.equal(y.number, 1);
  assert.equal(y.wuxing, "水");
});
test("2024-03-01", () => {
  const r = castNineStar({ year: 2024, month: 3, day: 1, hour: 12, gender: "女" });
  assert.equal(r.year.number, 3);
  assert.equal(r.month.number, 5);
});
test("steps 含立春", () => {
  const r = castNineStar({ year: 1990, month: 2, day: 5, hour: 12, gender: "男" });
  assert.ok(r.steps.length > 0 && r.steps.some((s) => s.includes("立春")));
});
test("真太陽時跨日", () => {
  const r = castNineStar({ year: 1990, month: 2, day: 4, hour: 23, minute: 50, gender: "男", longitude: 135 });
  assert.equal(r.date.day, 5);
});
