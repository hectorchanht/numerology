import { test } from "node:test";
import assert from "node:assert/strict";
import { wheelPoint, arcPath, latexPlain, perfectNumbers, pythagoreanComma } from "../test-dist/loreView.js";

test("wheelPoint:白羊 0° 在左、巨蟹 90° 在下", () => {
  const a = wheelPoint(0, 10, 50), c = wheelPoint(90, 10, 50);
  assert.ok(Math.abs(a.x - 40) < 1e-9 && Math.abs(a.y - 50) < 1e-9);
  assert.ok(Math.abs(c.x - 50) < 1e-9 && Math.abs(c.y - 60) < 1e-9);
  assert.match(arcPath(350, 10, 10, 50), / 0 0 0 /);
});

test("latexPlain", () => {
  assert.equal(latexPlain("\\tfrac{3}{4}\\sqrt{2} \\times 1000 \\approx 1060.7"), "3/4√2 × 1000 ≈ 1060.7");
  assert.equal(latexPlain("365 + 364 = 729 = 9^3 = 27^2"), "365 + 364 = 729 = 9³ = 27²");
});

test("完全數:第五個八位數、第六個尾數 6", () => {
  const p = perfectNumbers();
  assert.deepEqual(p.slice(0, 4).map((x) => x.value), [6, 28, 496, 8128]);
  assert.deepEqual([p[4].value, p[4].digits], [33550336, 8]);
  assert.deepEqual([p[5].value, p[5].last], [8589869056, 6]);
});

test("畢氏音差約 23.46 音分", () => {
  assert.ok(Math.abs(pythagoreanComma().cents - 23.46) < 0.01);
});
