import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const load = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), "utf8"));
const T = load("timaeus.json");
const W = T.worldSoul;

// 分數用 [分子, 分母] BigInt,免浮點誤差
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const frac = (s) => {
  const [n, d = "1"] = s.split("/");
  return norm([BigInt(n), BigInt(d)]);
};
const norm = ([n, d]) => {
  const g = gcd(n, d);
  return [n / g, d / g];
};
const mul = (a, b) => norm([a[0] * b[0], a[1] * b[1]]);
const div = (a, b) => norm([a[0] * b[1], a[1] * b[0]]);
const add = (a, b) => norm([a[0] * b[1] + b[0] * a[1], a[1] * b[1]]);
const eq = (a, b) => a[0] === b[0] && a[1] === b[1];
const str = ([n, d]) => (d === 1n ? `${n}` : `${n}/${d}`);

const harmonic = (a, b) => div(mul([2n, 1n], mul(a, b)), add(a, b));
const arithmetic = (a, b) => div(add(a, b), [2n, 1n]);

test("七數 = 二倍列同三倍列嘅併集", () => {
  assert.deepEqual([...new Set([...W.double, ...W.triple])].sort((a, b) => a - b), [...W.seven].sort((a, b) => a - b));
  W.double.slice(1).forEach((x, i) => assert.equal(x, W.double[i] * 2));
  W.triple.slice(1).forEach((x, i) => assert.equal(x, W.triple[i] * 3));
});

test("每個間隔插入調和中項同算術中項", () => {
  for (const [base, filled] of [[W.double, W.filledDouble], [W.triple, W.filledTriple]]) {
    const out = [];
    base.slice(1).forEach((b, i) => {
      const a = [BigInt(base[i]), 1n];
      const B = [BigInt(b), 1n];
      out.push(a, harmonic(a, B), arithmetic(a, B));
    });
    out.push([BigInt(base.at(-1)), 1n]);
    assert.deepEqual(out.map(str), filled);
  }
});

test("中項之間生出 3/2、4/3、9/8", () => {
  const I = Object.fromEntries(Object.entries(W.intervals).map(([k, v]) => [k, frac(v)]));
  const seen = new Set();
  for (const filled of [W.filledDouble, W.filledTriple])
    filled.slice(1).forEach((x, i) => seen.add(str(div(frac(x), frac(filled[i])))));
  for (const k of ["fifth", "fourth", "tone"]) assert.ok(seen.has(str(I[k])), k);
  assert.ok(eq(div(I.fifth, I.fourth), I.tone));
});

test("4/3 = (9/8)² × 256/243;Pythagorean 七音階一個八度 = 5 全音 + 2 leimma", () => {
  const tone = frac(W.intervals.tone);
  const L = frac(W.leimma);
  assert.ok(eq(mul(mul(tone, tone), L), frac(W.intervals.fourth)));
  let oct = [1n, 1n];
  for (let i = 0; i < 5; i++) oct = mul(oct, tone);
  assert.ok(eq(mul(mul(oct, L), L), [2n, 1n]));
});

test("leimma 連比每對都係 243:256", () => {
  for (const [a, b] of W.leimmaChain.pairs) assert.ok(eq(div(frac(a), frac(b)), [243n, 256n]), `${a}:${b}`);
});

test("正多面體:面數同元素三角形總數", () => {
  const S = Object.fromEntries(T.solids.items.map((s) => [s.element, s]));
  assert.deepEqual(Object.values(S).map((s) => s.faces), [4, 8, 20, 6]);
  assert.equal(S.water.faces * S.water.trianglesPerFace, S.water.statedTriangles);
  // Euler V − E + F = 2:V 由每頂點面數推出
  const perVertex = { tetrahedron: 3, octahedron: 4, icosahedron: 5, cube: 3 };
  const sides = { "equilateral triangle": 3, square: 4 };
  for (const s of T.solids.items) {
    const E = (s.faces * sides[s.faceShape]) / 2;
    const V = (s.faces * sides[s.faceShape]) / perVertex[s.solid];
    assert.equal(V - E + s.faces, 2, s.solid);
  }
});

test("元素轉換守恆三角形數(土除外)", () => {
  const tri = Object.fromEntries(T.solids.items.map((s) => [s.element, s.faces]));
  const sum = (xs) => xs.reduce((n, [e, k]) => n + tri[e] * k, 0);
  for (const r of T.transformations.rules) assert.equal(sum(r.from), sum(r.to), JSON.stringify(r));
  for (const r of T.transformations.rules) assert.ok(![...r.from, ...r.to].some(([e]) => e === "earth"));
});
