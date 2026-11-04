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
