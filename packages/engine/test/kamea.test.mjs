import { test } from "node:test";
import assert from "node:assert/strict";
import { planetarySquare } from "@numerology/knowledge";
import { castKamea } from "../dist/index.js";

function find(rows, v) {
  for (let r = 0; r < rows.length; r++) { const c = rows[r].indexOf(v); if (c >= 0) return { row: r, col: c }; }
}
test("週日 Sun", () => {
  const r = castKamea(1990, 3, 18, [{ value: 4, system: "lifepath" }, { value: 1, system: "ninestar" }]);
  assert.equal(r.weekday, 0); assert.equal(r.planet, "Sun"); assert.equal(r.order, 6);
  assert.equal(r.lineSum, 111); assert.equal(r.total, 666); assert.equal(r.marks.length, 2);
  const sq = planetarySquare("Sun").rows;
  assert.deepEqual(r.marks[0], { value: 4, system: "lifepath", ...find(sq, 4) });
  assert.deepEqual(r.marks[1], { value: 1, system: "ninestar", ...find(sq, 1) });
});
test("週六 Saturn", () => {
  const r = castKamea(1990, 2, 3, [{ value: 6, system: "lifepath" }, { value: 2, system: "ninestar" }]);
  assert.equal(r.weekday, 6); assert.equal(r.planet, "Saturn");
  assert.deepEqual(r.marks.map(({ value, row, col }) => ({ value, row, col })),
    [{ value: 6, row: 2, col: 2 }, { value: 2, row: 0, col: 2 }]);
});
test("超出略去", () => {
  assert.equal(castKamea(1990, 3, 18, [{ value: 50, system: "lifepath" }]).marks.length, 0);
});

test("幻方附 Agrippa 名數:Sun 方 Nachiel 111、Sorath 666", () => {
  const r = castKamea(2024, 1, 7, []);
  assert.equal(r.planet, "Sun");
  const by = Object.fromEntries(r.names.map((x) => [x.name, x]));
  assert.deepEqual([by.Nachiel.value, by.Nachiel.ref, by.Sorath.value, by.Sorath.ref], [111, "line", 666, "total"]);
});

test("幻方名數不列 unresolved 條目,值全部等於所標幻方數", () => {
  for (const [y, m, d] of [[2024, 1, 1], [2024, 1, 3], [2024, 1, 5]]) {
    const r = castKamea(y, m, d, []);
    const want = { order: r.order, cells: r.order ** 2, line: r.lineSum, total: r.total };
    for (const x of r.names) {
      assert.ok(["divine name", "intelligence", "spirit"].includes(x.role), x.role);
      if (x.ref) assert.equal(x.value, want[x.ref]);
      assert.ok(!x.unresolved);
    }
  }
});
