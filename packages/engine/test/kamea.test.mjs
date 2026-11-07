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
