import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { allHexagrams } from "../dist/index.js";

const load = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), "utf8"));
const H = load("heluo-lishu.json");

// 三爻由下而上
const TRI = { 乾: [1, 1, 1], 兌: [1, 1, 0], 離: [1, 0, 1], 震: [1, 0, 0], 巽: [0, 1, 1], 坎: [0, 1, 0], 艮: [0, 0, 1], 坤: [0, 0, 0] };
const triOf = (bits) => Object.keys(TRI).find((k) => TRI[k].join("") === bits.join(""));
const hexByName = (name) => allHexagrams().find((h) => h.name === name.replace("无", "無")); // 書作「无妄」
const hexOf = (bits) => allHexagrams().find((h) => h.bits.join("") === bits.join(""));

const reduce = (sum, base) => {
  const n = sum > base ? sum - base : sum;
  return n % 10 === 0 ? n / 10 : n % 10;
};
const numbers = (pillars) => {
  let heaven = 0, earth = 0;
  for (const [g, z] of pillars) {
    for (const v of [H.stemNumbers.values[g], ...H.branchNumbers.values[z]]) v % 2 ? (heaven += v) : (earth += v);
  }
  return { heaven, earth };
};
const yangYear = (pillars) => "甲丙戊庚壬".includes(pillars[0][0]);
const order = (bits, yangHour) => {
  const L = [], O = [];
  bits.forEach((b, i) => (b === (yangHour ? 1 : 0) ? L : O).push(i + 1));
  return [null, [L[0], L[0], ...O.slice(0, 4)], [...L, ...L, ...O.slice(0, 2)], [...L, ...L], [...L, ...O.slice(0, 2)], [...L, ...O.slice(0, 1)]][L.length];
};
const BRANCH = "子丑寅卯辰巳午未申酉戌亥";

test("天干洛書數同八卦一致;地支河圖數成對相差 5", () => {
  for (const [g, n] of Object.entries(H.stemNumbers.values)) assert.equal(H.luoshuTrigram.values[n], H.stemNumbers.trigram[g], g);
  for (const [z, [a, b]] of Object.entries(H.branchNumbers.values)) assert.equal(b - a, 5, z);
  assert.equal(1 + 3 + 5 + 7 + 9, H.base.heaven);
  assert.equal(2 + 4 + 6 + 8 + 10, H.base.earth);
});

test("書中四個算例:天數、地數、所得之卦(證實地支數用寅卯三八、巳午二七)", () => {
  for (const ex of H.examples.filter((e) => e.heaven !== undefined)) {
    const { heaven, earth } = numbers(ex.pillars);
    assert.equal(heaven, ex.heaven, ex.pillars.join(""));
    assert.equal(earth, ex.earth, ex.pillars.join(""));
    if (ex.heavenTrigram) {
      assert.equal(H.luoshuTrigram.values[reduce(heaven, 25)], ex.heavenTrigram);
      assert.equal(H.luoshuTrigram.values[reduce(earth, 30)], ex.earthTrigram);
    }
  }
  // 照原書印法(寅卯二八)第一例天數唔對
  const misprint = { ...H.branchNumbers.values, 卯: [2, 8] };
  const odd = ["甲子", "丁卯", "庚申", "庚辰"].flatMap(([g, z]) => [H.stemNumbers.values[g], ...misprint[z]]).filter((v) => v % 2).reduce((a, b) => a + b);
  assert.notEqual(odd, 31);
});

test("遇十不用:10→1、20→2、30→3,天數 25 用 5,地數 30 用 3", () => {
  assert.equal(reduce(35, 25), 1);
  assert.equal(reduce(50, 30), 2);
  assert.equal(reduce(60, 30), 3);
  assert.equal(reduce(30, 30), 3);
  assert.equal(reduce(25, 25), 5);
  assert.equal(reduce(44, 25), 9);
  assert.equal(reduce(22, 25), 2);
});

test("元堂各式:通用規則重算書中十個例卦", () => {
  for (const g of H.yuantang.generic) {
    const hex = hexByName(g.example.hex);
    assert.ok(hex, g.example.hex);
    assert.deepEqual(order(hex.bits, g.example.hour === "陽"), g.example.order, g.example.hex);
  }
});

test("先天卦、元堂、後天卦、大運:三個完整算例", () => {
  for (const ex of H.examples.filter((e) => e.xiantian)) {
    const { heaven, earth } = numbers(ex.pillars);
    const T = TRI[H.luoshuTrigram.values[reduce(heaven, 25)]];
    const E = TRI[H.luoshuTrigram.values[reduce(earth, 30)]];
    const heavenUp = yangYear(ex.pillars) === (ex.gender === "male");
    const bits = heavenUp ? [...E, ...T] : [...T, ...E];
    assert.equal(hexOf(bits).name, ex.xiantian);
    const h = BRANCH.indexOf(ex.hour);
    const yt = order(bits, h < 6)[h % 6];
    assert.equal(yt, ex.yuantang, ex.xiantian);
    // 後天:變元堂爻,內外互換
    const flipped = bits.map((b, i) => (i + 1 === yt ? 1 - b : b));
    const hou = [...flipped.slice(3), ...flipped.slice(0, 3)];
    assert.equal(hexOf(hou).name, ex.houtian);
    assert.equal(yt > 3 ? yt - 3 : yt + 3, ex.houtianYuantang);
    if (ex.houtianAge) {
      let years = 0;
      for (let k = 0; k < 6; k++) years += bits[(yt - 1 + k) % 6] ? H.dayun.yang : H.dayun.yin;
      assert.equal(years + 1, ex.houtianAge, `${ex.xiantian} 先天行 ${years} 年`);
    }
  }
});

test("元氣、化工、元氣相反:都係八卦,相反係先天對宮", () => {
  const OPP = { 乾: "坤", 坤: "乾", 艮: "兌", 兌: "艮", 坎: "離", 離: "坎", 震: "巽", 巽: "震" };
  assert.deepEqual(H.yuanqi.stems, H.stemNumbers.trigram);
  assert.equal(Object.keys(H.yuanqi.branches).length, 12);
  for (const p of H.huagong.periods) assert.equal(p.reverse, OPP[p.trigram]);
  assert.deepEqual(H.huagong.earth.reverse, H.huagong.earth.trigrams.map((t) => OPP[t]));
});

test("寄宮詩:三元男女取卦齊全;三元一周 180 年", () => {
  const F = H.fiveRule;
  assert.deepEqual(Object.keys(F.middle).sort(), ["yangFemale", "yangMale", "yinFemale", "yinMale"]);
  assert.equal((1684 - H.yuan.anchorUpper) % 180, 0); // 康熙甲子上元
  assert.equal((1744 - H.yuan.anchorUpper) % 180, 60); // 乾隆甲子中元
});

test("卦氣歌:十二月各五卦,六十卦不重複、不含坎震離兌", () => {
  const all = Object.values(H.guaqi.months).flat();
  assert.equal(all.length, 60);
  assert.equal(new Set(all).size, 60);
  for (const n of ["坎", "震", "離", "兌"]) assert.ok(!all.includes(n));
  for (const n of all) assert.ok(hexByName(n), n);
});

test("小象、月卦、日卦算例:卦名都是六十四卦", () => {
  for (const e of H.xiaoxiang.examples) for (const n of [e.hex, ...e.years]) assert.ok(hexByName(n), n);
  for (const n of H.monthHex.example.months) assert.ok(hexByName(n), n);
});

test("天地數分類:安和自寧唯一,各型區間合法", () => {
  const P = H.numberClasses.patterns.items;
  // 兩項為閉區間(null = 無界),其餘為枚舉值
  const inR = (v, r) => (r.length === 2 ? (r[0] === null || v >= r[0]) && (r[1] === null || v <= r[1]) : r.includes(v));
  const hit = (h, e) => P.filter((p) => inR(h, p.heaven) && inR(e, p.earth)).map((p) => p.name);
  assert.deepEqual(hit(25, 30), ["安和自寧"]);
  assert.ok(hit(18, 42).includes("以弱敵強")); // 卷一 p. 84 例
  assert.ok(hit(11, 30).includes("陽偏")); // 卷一 p. 85 例
  assert.ok(hit(40, 30).includes("孤陽自耦"));
});
