import { test } from "node:test";
import assert from "node:assert/strict";
import { taixuanGrid, tzolkinCell } from "../test-dist/cycleView.js";
import { castMaya } from "@numerology/engine";

const tx = (head, zan, extra = null) => ({ head, zan, extra });

test("taixuanGrid:首 1 → (0,0),首 81 → (8,8),首 10 → (1,0)", () => {
  assert.deepEqual(taixuanGrid(tx(1, 3)), { head: 1, zan: 3, row: 0, col: 0 });
  assert.deepEqual(taixuanGrid(tx(81, 9)), { head: 81, zan: 9, row: 8, col: 8 });
  assert.deepEqual(taixuanGrid(tx(10, 1)), { head: 10, zan: 1, row: 1, col: 0 });
});

test("taixuanGrid:踦、嬴不在 81 首內,回 null", () => {
  assert.equal(taixuanGrid(tx(null, null, "踦")), null);
  assert.equal(taixuanGrid(tx(null, null, "嬴")), null);
});

test("tzolkinCell:2012-12-21 = 4 Ajaw → row 3 col 19", () => {
  const m = castMaya(2012, 12, 21);
  assert.equal(m.tzolkin.dayName, "Ajaw");
  assert.deepEqual(tzolkinCell(m), { row: 3, col: 19 });
});

test("parseLiurenAt:空白、格式不合、超出 1900–2100 → null;邊界與中間值照解", async () => {
  const { parseLiurenAt } = await import("../test-dist/cycleView.js");
  assert.equal(parseLiurenAt(""), null);
  assert.equal(parseLiurenAt("2000-6-1T12:00"), null);
  assert.equal(parseLiurenAt("abcd-ef-ghTij:kl"), null);
  assert.equal(parseLiurenAt("1899-12-31T23:59"), null);
  assert.deepEqual(parseLiurenAt("1900-01-01T00:00"), { year: 1900, month: 1, day: 1, hour: 0, minute: 0 });
  assert.deepEqual(parseLiurenAt("2100-12-31T23:59"), { year: 2100, month: 12, day: 31, hour: 23, minute: 59 });
  assert.equal(parseLiurenAt("2101-01-01T00:00"), null);
  assert.deepEqual(parseLiurenAt("2000-06-15T12:30"), { year: 2000, month: 6, day: 15, hour: 12, minute: 30 });
});
