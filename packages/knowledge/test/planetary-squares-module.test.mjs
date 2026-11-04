import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { planetarySquare } from "../dist/index.js";

const P = JSON.parse(readFileSync(new URL("../data/planetary-squares.json", import.meta.url), "utf8"));

test("內聯模組與 JSON 一致", () => {
  for (const s of P.squares) assert.deepEqual(planetarySquare(s.planet).rows, s.rows, s.planet);
});

test("Saturn 即洛書", () => {
  assert.deepEqual(planetarySquare("Saturn").rows, [[4, 9, 2], [3, 5, 7], [8, 1, 6]]);
});

test("Sun 行和 111 總和 666", () => {
  const rows = planetarySquare("Sun").rows;
  for (const r of rows) assert.equal(r.reduce((a, b) => a + b, 0), 111);
  assert.equal(rows.flat().reduce((a, b) => a + b, 0), 666);
});

test("未知行星拋錯", () => {
  assert.throws(() => planetarySquare("Pluto"), /未知行星/);
});
