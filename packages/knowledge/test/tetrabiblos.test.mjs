import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const load = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), "utf8"));
const P = load("tetrabiblos.json");
const A = load("agrippa-correspondences.json");
const FIVE = ["Saturn", "Jupiter", "Mars", "Venus", "Mercury"];
const SIGNS = P.terms.signs;

test("宮位:日月各一宮,五星各兩宮,十二宮剛好分齊;同 Agrippa 黃道守護一致", () => {
  const owned = [...Object.values(P.houses.luminaries), ...Object.values(P.houses.planets).flatMap((h) => [h.day, h.night])];
  assert.deepEqual([...owned].sort(), [...SIGNS].sort());
  for (const z of A.zodiac) {
    const ruler = Object.entries(P.houses.luminaries).find(([, s]) => s === z.sign)?.[0]
      ?? Object.entries(P.houses.planets).find(([, h]) => h.day === z.sign || h.night === z.sign)[0];
    assert.equal(ruler, z.ruler, z.sign);
  }
});

test("三方:四組各三宮,互相相隔 120°", () => {
  const all = P.triplicities.items.flatMap((t) => t.signs);
  assert.deepEqual([...all].sort(), [...SIGNS].sort());
  for (const t of P.triplicities.items) {
    const i = t.signs.map((s) => SIGNS.indexOf(s));
    assert.deepEqual([i[1] - i[0], i[2] - i[1]], [4, 4], t.signs.join());
  }
});

test("廟旺:落陷 = 對宮;日同土互相對立", () => {
  for (const [p, e] of Object.entries(P.exaltations.items))
    assert.equal(SIGNS.indexOf(e.fall), (SIGNS.indexOf(e.sign) + 6) % 12, p);
  const ex = P.exaltations.items;
  assert.equal(ex.Sun.sign, ex.Saturn.fall);
});

const check = (bySign) => {
  for (const s of SIGNS) {
    const t = bySign[s];
    assert.equal(t.reduce((n, x) => n + x.deg, 0), 30, s);
    assert.deepEqual(t.map((x) => x.planet).sort(), [...FIVE].sort(), s);
  }
};

test("埃及界:每宮 30°、五星各一段;總度數 = 書中所列 57/79/66/82/76,合共 360", () => {
  const E = P.terms.egyptian;
  check(E.bySign);
  const tot = Object.fromEntries(FIVE.map((p) => [p, 0]));
  for (const s of SIGNS) for (const x of E.bySign[s]) tot[x.planet] += x.deg;
  assert.deepEqual(tot, E.statedTotals);
  assert.equal(Object.values(tot).reduce((a, b) => a + b), 360);
});

test("托勒密界:每宮 30°、五星各一段;巨蟹火星先、獅子土星先", () => {
  const T = P.terms.ptolemaic.bySign;
  check(T);
  assert.equal(T.Cancer[0].planet, "Mars");
  assert.equal(T.Leo[0].planet, "Saturn");
});

test("迦勒底界:8-7-6-5-4 規則推出日間總度數同書中一致", () => {
  const C = P.terms.chaldean;
  const tot = Object.fromEntries(FIVE.map((p) => [p, 0]));
  for (const [lead, order] of Object.entries(C.order)) {
    assert.equal(P.triplicities.items.filter((t) => t.signs.includes(lead)).length, 1);
    order.forEach((p, i) => (tot[p] += (8 - i) * 3));
  }
  assert.deepEqual(tot, C.stated.day);
});

test("相位:四種相位都係 360 嘅整除部分,亦係 30° 嘅倍數", () => {
  for (const [k, v] of Object.entries(P.aspects.degrees)) {
    assert.equal(360 % v, 0, k);
    assert.equal(v % 30, 0, k);
  }
});

test("性質分類:每組互斥並覆蓋七曜", () => {
  const n = P.natures;
  for (const g of [["benefic", "malefic", "common"], ["feminine", "masculine", "bothSexes"], ["diurnal", "nocturnal", "bothSects"]]) {
    const all = g.flatMap((k) => n[k]);
    assert.equal(new Set(all).size, 7, g.join());
  }
});
