import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const load = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), "utf8"));
const D = load("hetu-luoshu.json");
const T = load("tianwang-souqi.json");
const sum = (xs) => xs.reduce((a, b) => a + b, 0);

test("河圖:一至十各一,每方生成數差五、一奇一耦", () => {
  const all = Object.values(D.hetu.positions).flat().sort((a, b) => a - b);
  assert.deepEqual(all, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  for (const [a, b] of Object.values(D.hetu.positions)) {
    assert.equal(b - a, 5);
    assert.notEqual(a % 2, b % 2);
  }
  // 本義上下左右、關子明外圈成數同方位一致(上南下北、左東右西)
  assert.equal(D.hetu.outer.前, D.hetu.positions.南[1]);
  assert.equal(D.hetu.outer.後, D.hetu.positions.北[1]);
  assert.equal(D.hetu.outer.左, D.hetu.positions.東[1]);
  assert.equal(D.hetu.outer.右, D.hetu.positions.西[1]);
  assert.deepEqual(Object.values(D.hetu.wuxing.values), Object.values(D.hetu.positions));
});

test("天地之數:奇 25、耦 30、共 55;大衍 50 用 49;河圖 55、洛書 45", () => {
  const N = D.numbers;
  assert.equal(sum(N.heaven.members), N.heaven.value);
  assert.equal(sum(N.earth.members), N.earth.value);
  assert.equal(N.heaven.value + N.earth.value, N.total.value);
  assert.equal(N.dayan.used, N.dayan.value - 1);
  assert.equal(sum(Object.values(D.hetu.positions).flat()), N.hetuSum);
  assert.equal(sum(D.luoshu.grid.flat()), N.luoshuSum);
});

test("洛書:戴九履一、左三右七、二四為肩、六八為足,縱橫斜皆十五", () => {
  const g = D.luoshu.grid;
  assert.equal(g[0][1], 9);
  assert.equal(g[2][1], 1);
  assert.equal(g[1][0], 3);
  assert.equal(g[1][2], 7);
  assert.deepEqual([g[0][0], g[0][2]], [4, 2]); // 四前左、二前右
  assert.deepEqual([g[2][0], g[2][2]], [8, 6]); // 八後左、六後右
  const lines = [...g, ...[0, 1, 2].map((c) => g.map((r) => r[c])), [g[0][0], g[1][1], g[2][2]], [g[0][2], g[1][1], g[2][0]]];
  for (const l of lines) assert.equal(sum(l), 15);
});

test("劉牧互易:河圖洛書數對調", () => {
  const { standard: s, liuMu: l } = D.dispute;
  assert.equal(s.hetu, l.luoshu);
  assert.equal(s.luoshu, l.hetu);
});

test("范望太玄天干數同《天網搜奇錄》太玄數一致", () => {
  assert.deepEqual(D.taixuanLink.stems, T.taixuanNumber.stems);
});
