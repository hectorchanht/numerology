import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const D = JSON.parse(readFileSync(new URL("../data/heluo-ggz.json", import.meta.url), "utf8"));
const S = "甲乙丙丁戊己庚辛壬癸";
const B = "子丑寅卯辰巳午未申酉戌亥";
// 六十甲子納音五行,兩柱一組
const NAYIN = "金火木土金火水土金木水土火木水金火木土金火水土金木水土火木水";
const gzIndex = (gz) => [...Array(60).keys()].find((i) => S[i % 10] === gz[0] && B[i % 12] === gz[1]);
const nayin = (gz) => NAYIN[Math.floor(gzIndex(gz) / 2)];

test("金鎖銀匙:按規則重算五個書例(木部例書誤作 3313)", () => {
  const J = D.jinsuoYinshi;
  for (const ex of J.examples) {
    const [year, , day, hour] = ex.pillars;
    assert.equal(nayin(year), ex.nayin, year);
    const d = B.indexOf(day[1]), h = B.indexOf(hour[1]);
    const fwd = d === h ? 13 : ((h - d + 12) % 12) + 1;
    const rest = d + 1 + h + 1 + J.nayinAdd[ex.nayin] + J.buNumber[ex.nayin];
    assert.equal(J.base + fwd * 100 + rest, ex.result, ex.pillars.join(""));
    if (ex.reverse) assert.equal(J.base + (14 - fwd) * 100 + rest, ex.reverse);
  }
});

test("範衍:各疇章數為 C(9,k),合共 512;曆法換算", () => {
  const C = (n, k) => (k === 0 ? 1 : (C(n, k - 1) * (n - k + 1)) / k);
  for (const c of D.fanyan.chou) assert.equal(c.chapters, C(9, c.k), c.name);
  assert.equal(D.fanyan.chou.reduce((a, c) => a + c.chapters, 0), 512);
  const K = D.fanyan.calendar;
  for (const y of [K.year, K.leapYear]) assert.equal((y.chapters * K.hoursPerChapter) / K.hoursPerDay, y.days);
});

test("廣象徹微:四畫積數共 25 種,書中個數吻合;甲子年例得 24、16", () => {
  const G = D.guangxiang;
  const v = Object.values(G.values);
  const n = {};
  for (const a of v) for (const b of v) for (const c of v) for (const d of v) n[a * b * c * d] = (n[a * b * c * d] ?? 0) + 1;
  assert.equal(Object.keys(n).length, 25);
  for (const [k, c] of Object.entries(G.counts.values)) assert.equal(n[k], c, k);
  const xiang = Object.keys(G.values);
  const mod4 = (i) => xiang[(i % 4 || 4) - 1];
  const [y, m, dd, h] = G.example.pillars;
  assert.deepEqual([y, m, dd, h].map((gz) => mod4(B.indexOf(gz[1]) + 1)), G.example.branch.xiang);
  assert.deepEqual([y, m, dd, h].map((gz) => mod4(S.indexOf(gz[0]) + 1)), G.example.stem.xiang);
  const prod = (xs) => xs.reduce((a, x) => a * G.values[x], 1);
  assert.equal(prod(G.example.branch.xiang), G.example.branch.product);
  assert.equal(prod(G.example.stem.xiang), G.example.stem.product);
});
