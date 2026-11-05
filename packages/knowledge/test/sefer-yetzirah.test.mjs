import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const load = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), "utf8"));
const Y = load("sefer-yetzirah.json");
const A = load("agrippa-correspondences.json");

const mothers = Y.mothers.items.map((m) => m.letter);
const all = [...mothers, ...Y.doubles.letters, ...Y.simples.letters];
const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));

test("3 母 + 7 雙 + 12 單 = 22 字母,剛好分齊希伯來字母表", () => {
  const s = Y.structure;
  assert.equal(s.mothers + s.doubles + s.simples, s.letters);
  assert.equal(s.sephiroth + s.letters, s.paths);
  assert.deepEqual([mothers.length, Y.doubles.letters.length, Y.simples.letters.length], [s.mothers, s.doubles, s.simples]);
  assert.deepEqual([...all].sort(), A.hebrew.letters.map((l) => l.glyph).sort());
});

test("231 門 = C(22, 2);n 個字母成 n! 間屋", () => {
  assert.equal(Y.gates.value, (22 * 21) / 2);
  for (const [n, v] of Y.permutations.stated) assert.equal(v, fact(n), `${n}`);
});

test("六封印 = I、H、V 三字母嘅 6 個排列,六個方向各一", () => {
  const orders = Y.sixSeals.seals.map((s) => s.order);
  assert.equal(new Set(orders).size, fact(3));
  for (const o of orders) assert.deepEqual([...o].sort(), ["H", "I", "V"]);
  assert.equal(new Set(Y.sixSeals.seals.map((s) => s.direction)).size, 6);
});

test("母字母陰陽次序係同三個字母嘅排列;陽序以本字母開頭", () => {
  for (const m of Y.mothers.items)
    for (const o of [m.male, m.female].filter(Boolean)) assert.deepEqual([...o].sort(), ["A", "M", "S"]);
  for (const m of Y.mothers.items.filter((x) => x.male)) assert.equal(m.male[0], m.name[0]);
});

test("雙字母:7 對相反、7 方位、7 竅;補充表行星同星期各一", () => {
  const d = Y.doubles;
  for (const k of ["pairs", "localities", "ancientPlanetOrder", "gates"]) assert.equal(d[k].length, 7, k);
  const sup = d.supplement.items;
  assert.deepEqual(sup.map((x) => x.letter), d.letters);
  assert.deepEqual([...sup.map((x) => x.planet)].sort(), [...d.ancientPlanetOrder].sort());
  assert.deepEqual(sup.map((x) => x.day), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual([...sup.map((x) => x.organ)].sort(), [...d.gates].sort());
});

test("單字母:補充表依次配十二宮同十二月,官能同第五章清單一致", () => {
  const s = Y.simples, sup = s.supplement.items;
  assert.deepEqual(sup.map((x) => x.letter), s.letters);
  assert.deepEqual(sup.map((x) => x.sign), A.zodiac.map((z) => z.sign));
  assert.deepEqual(sup.map((x) => x.month), s.months);
  assert.deepEqual([...sup.map((x) => x.faculty)].sort(), [...s.faculties].sort());
  assert.equal(new Set(s.directions).size, 12);
});
