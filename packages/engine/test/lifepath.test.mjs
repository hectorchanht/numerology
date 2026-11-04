import { test } from "node:test";
import assert from "node:assert/strict";
import { reduceNumber, lifePath, hetuWuxing } from "../dist/index.js";

test("reduceNumber", () => {
  assert.deepEqual(reduceNumber(1990), [1990, 19, 10, 1]);
  assert.deepEqual(reduceNumber(29), [29, 11]);
});
test("lifePath", () => {
  const a = lifePath(1990, 3, 18);
  assert.equal(a.byComponents, 4); assert.equal(a.byDigits, 4); assert.equal(a.methodsAgree, true);
  const b = lifePath(2009, 11, 29);
  assert.equal(b.byComponents, 33); assert.equal(b.byDigits, 6); assert.equal(b.methodsAgree, false);
  assert.equal(lifePath(1990, 2, 3).value, 6);
  assert.equal(lifePath(1990, 2, 3).steps.components[0], "1990 → 19 → 10 → 1");
});
test("hetuWuxing", () => {
  const exp = { 1: "水", 2: "火", 3: "木", 4: "金", 5: "土", 6: "水", 7: "火", 8: "木", 9: "金", 11: "火", 22: "金", 33: "水" };
  for (const [k, v] of Object.entries(exp)) assert.equal(hetuWuxing(Number(k)), v);
});
