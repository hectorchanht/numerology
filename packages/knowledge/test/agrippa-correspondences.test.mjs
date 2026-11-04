import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const load = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), "utf8"));
const A = load("agrippa-correspondences.json");
const P = load("planetary-squares.json");
const PLANETS = ["Saturn", "Jupiter", "Mars", "Sun", "Venus", "Mercury", "Moon"];

test("七曜齊全,每項對照非空", () => {
  assert.deepEqual(Object.keys(A.planets).sort(), [...PLANETS].sort());
  for (const [p, c] of Object.entries(A.planets)) {
    for (const k of ["elements", "metals", "stones", "plants", "animals", "birds", "places", "colors"])
      assert.ok(c[k]?.length, `${p}.${k}`);
    assert.ok(c.fume.compound.length && c.fume.sevenAromatics, `${p}.fume`);
  }
});

test("十二宮:主星係七曜之一,宮色成對覆蓋 1..12", () => {
  assert.equal(A.zodiac.length, 12);
  for (const z of A.zodiac) assert.ok(PLANETS.includes(z.ruler), z.sign);
  assert.deepEqual(A.houseColors.pairs.flatMap(([a, b]) => [a, b]).sort((x, y) => x - y), Array.from({ length: 12 }, (_, i) => i + 1));
  assert.equal(A.fixedStars.stars.length, 15);
});

test("希伯來字母值 + 太陽 Intelligence/Spirit 名字數值同方陣一致", () => {
  const v = new Map(A.hebrew.letters.flatMap((l) => [[l.glyph, l.value]]));
  const gem = (s) => [...s].reduce((n, ch) => n + v.get(ch), 0);
  assert.equal(A.hebrew.letters.length, 22);
  assert.equal(A.hebrew.letters.reduce((n, l) => n + l.value, 0), 1495);
  const sun = P.squares.find((s) => s.planet === "Sun");
  assert.equal(gem(sun.intelligence.hebrew), sun.intelligence.value);
  assert.equal(gem(sun.spirit.hebrew), sun.spirit.value);
});
