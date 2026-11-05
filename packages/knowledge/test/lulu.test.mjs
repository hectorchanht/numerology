import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const L = JSON.parse(readFileSync(new URL("../data/lulu.json", import.meta.url), "utf8"));
const step = { up: 4 / 3, down: 2 / 3 };

test("管子五音:1×3⁴ = 81,之後益、損、益、損", () => {
  const [gong, ...rest] = L.guanzi.fiveNotes;
  assert.equal(gong.value, 3 ** 4);
  rest.reduce((prev, n) => (assert.equal(n.value, (prev.value * step[n.step])), n), gong);
});

test("淮南子:3¹¹ = 177147;律數同三分損益精確值相差 < 1", () => {
  assert.equal(3 ** 11, 177147);
  const p = L.huainanzi.pipes;
  let exact = p[0].value;
  for (let i = 1; i < 12; i++) {
    exact *= step[p[i - 1].next];
    assert.ok(Math.abs(p[i].value - exact) < 1, `${p[i].pipe} ${p[i].value} vs ${exact.toFixed(2)}`);
  }
  // 頭五律係整數,即五音
  for (const [, pipe] of Object.entries(L.huainanzi.modes)) assert.ok(Number.isInteger(p.find((x) => x.pipe === pipe).value));
});

test("仲呂再損一得唔返清黃鐘(81/2):差一個 Pythagorean comma 3¹²/2¹⁹", () => {
  const p = L.huainanzi.pipes;
  let x = p[0].value;
  for (const q of p.slice(0, -1)) x *= step[q.next];
  assert.ok(Math.abs(p[0].value / 2 / (x * step.down) - 3 ** 12 / 2 ** 19) < 1e-12);
});

test("呂氏上下組:除蕤賓一步外,同淮南子嘅上生/下生一致", () => {
  const up = new Set(L.lushi.upper);
  const diff = L.huainanzi.pipes.filter((x) => x.next && (up.has(x.pipe) ? "down" : "up") !== x.next).map((x) => x.pipe);
  assert.deepEqual(diff, ["蕤賓"]);
  assert.equal(L.lushi.upper.length + L.lushi.lower.length, 12);
});

test("月令:呂氏季節同淮南子月份一致,十二月各一律", () => {
  const name = { 1: "孟春", 2: "仲春", 3: "季春", 4: "孟夏", 5: "仲夏", 6: "季夏", 7: "孟秋", 8: "仲秋", 9: "季秋", 10: "孟冬", 11: "仲冬", 12: "季冬" };
  const p = L.huainanzi.pipes;
  assert.equal(new Set(p.map((x) => x.month)).size, 12);
  for (const x of p) assert.equal(L.lushi.season[x.pipe], name[x.month], x.pipe);
});
