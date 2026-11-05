import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const load = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), "utf8"));
const T = load("tianwang-souqi.json");
const H = load("heluo-lishu.json");
const { taixuanNumber: TX, tiebanLecture: L } = T;

test("太玄數:十干十二支齊全,對沖支同數", () => {
  assert.equal(Object.keys(TX.stems).length, 10);
  assert.equal(Object.keys(TX.branches).length, 12);
  const B = "子丑寅卯辰巳午未申酉戌亥";
  for (let i = 0; i < 6; i++) assert.equal(TX.branches[B[i]], TX.branches[B[i + 6]], B[i]);
  // 天干相合(甲己、乙庚…)同數
  for (const [a, b] of ["甲己", "乙庚", "丙辛", "丁壬", "戊癸"]) assert.equal(TX.stems[a], TX.stems[b]);
});

test("比卦:納甲干支太玄數相加,遇十不用,上下並排得 2642", () => {
  const side = (s) => {
    s.lines.forEach((gz, i) => assert.equal(TX.stems[gz[0]] + TX.branches[gz[1]], s.sums[i], gz));
    assert.equal(s.sums.filter((n) => n !== 10).reduce((a, b) => a + b, 0), s.total);
    return s.total;
  };
  assert.equal(Number(`${side(L.bi.upper)}${side(L.bi.lower)}`), L.bi.result);
});

test("履卦:上卦洛書數作前綴、減下卦洛書數", () => {
  const luo = Object.fromEntries(Object.entries(H.luoshuTrigram.values).map(([k, v]) => [v, Number(k)]));
  assert.equal(luo[L.lu.upper], 6);
  assert.equal(luo[L.lu.lower], 7);
  assert.equal(Number(`${luo[L.lu.upper]}${L.lu.lineSum}`) - luo[L.lu.lower], L.lu.result);
});

test("講義大運:加年支河圖兩數、干合兩干同變、運干加第一位", () => {
  for (const ex of L.dayun.examples) {
    const [a, b] = H.branchNumbers.values[ex.pillars[0][1]];
    assert.equal(a + b, ex.branchAdd);
    assert.equal((ex.combined ?? ex.base) + ex.branchAdd, ex.natal);
    assert.equal(ex.natal + ex.luckNumber * 1000, ex.inLuck);
  }
  const [, ex2] = L.dayun.examples; // 甲(月)己(年)合 → 1
  assert.equal(String(ex2.combined)[0], "1");
  assert.equal(String(ex2.combined)[3], "1");
});

test("坊本夫命生年:先陽後陰,十干各一", () => {
  const o = T.fangbenOrder.order;
  assert.equal(new Set(o).size, 10);
  const yang = "甲丙戊庚壬";
  assert.ok(o.slice(0, 5).every((s) => yang.includes(s)));
  assert.ok(o.slice(5).every((s) => !yang.includes(s)));
});

test("馬翰如命例:按《河洛理數》表重算 31/36;將庚當 4 正好得書中 28/40,再化得震 3、坎 1", () => {
  const c = T.heluoCases.find((x) => x.label.startsWith("馬翰如"));
  const sum = (stemTable) => {
    let heaven = 0, earth = 0;
    for (const [s, b] of c.pillars) for (const n of [stemTable[s], ...H.branchNumbers.values[b]]) n % 2 ? (heaven += n) : (earth += n);
    return { heaven, earth };
  };
  const stems = H.stemNumbers.values;
  assert.deepEqual(sum(stems), c.recomputed);
  assert.deepEqual(sum({ ...stems, 庚: 4 }), { heaven: c.stated.heaven, earth: c.stated.earth });
  const reduce = (n, base) => { const r = n > base ? n - base : n; return r % 10 === 0 ? r / 10 : r % 10; };
  assert.equal(reduce(c.stated.heaven, 25), c.stated.heavenNumber);
  assert.equal(reduce(c.stated.earth, 30), c.stated.earthNumber);
});

test("擲錢:陽面 3/0 為動爻,2 陽為陰爻,1 陽為陽爻", () => {
  assert.match(T.coinRule.table[3], /動/);
  assert.match(T.coinRule.table[0], /動/);
  assert.equal(T.coinRule.table[2], "陰爻");
  assert.equal(T.coinRule.table[1], "陽爻");
});
