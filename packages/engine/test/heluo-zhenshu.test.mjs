import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { allHexagrams } from "@numerology/knowledge";
import { castHeluo, heluoMonths } from "../dist/index.js";

// 《河洛真數》卷上同本站(《河洛理數》卷一)對校:本站規則合者用引擎驗,異說用真數自己嘅推法重算書例。
const D = JSON.parse(readFileSync(new URL("../../knowledge/data/heluo-zhenshu.json", import.meta.url), "utf8"));
const HEX = allHexagrams();
const name = (bits) => HEX.find((h) => h.bits.join("") === bits.join("")).name;
const bitsOf = (n) => HEX.find((h) => h.name === n).bits;
const BR = "子丑寅卯辰巳午未申酉戌亥";
const cast = ([y, m, d, h]) => castHeluo({ year: y, month: m, day: d, hour: h, gender: "男" });
const houtian = (bits, line) => {
  const f = bits.map((b, i) => (i + 1 === line ? 1 - b : b));
  return name([...f.slice(3), ...f.slice(0, 3)]);
};

/** 真數元堂:同性爻(一二重數、三不重、四五不重)數完,由最後一個同性爻向上循環寄異性爻。 */
function yuantangZhen(bits, hour) {
  const b = BR.indexOf(hour), yang = b < 6 ? 1 : 0, k = b % 6;
  const same = [1, 2, 3, 4, 5, 6].filter((l) => bits[l - 1] === yang);
  let seq = same.length <= 2 ? [...same, ...same] : [...same];
  for (let l = seq[seq.length - 1]; seq.length < 6; ) {
    l = (l % 6) + 1;
    if (bits[l - 1] !== yang) seq.push(l);
  }
  return seq[k];
}

/** 真數乾坤純卦:數足六爻;男乾女坤由下而上;女乾、男坤冬至後夏至前由上而下。 */
function pureZhen(hexName, hour, male, yangSeason) {
  const k = (BR.indexOf(hour) % 6) + 1;
  const down = (hexName === "乾" ? !male : male) && yangSeason;
  return down ? 7 - k : k;
}

test("先賢十局:非純卦七局,本站引擎先後天同書合", () => {
  for (const c of D.cases.items.filter((c) => c.engine === true)) {
    const r = cast(c.date);
    assert.deepEqual(r.pillars, c.pillars, c.name);
    assert.equal(r.heaven, c.heaven, c.name);
    assert.equal(r.earth, c.earth, c.name);
    assert.equal(r.xiantian.name, c.xiantian, c.name);
    assert.equal(r.houtian.name, c.houtian, c.name);
    if (c.houtianAge) assert.equal(r.houtianAge, c.houtianAge);
  }
});

test("先賢十局:三個純卦局本站不合,真數純卦法合", () => {
  for (const c of D.cases.items.filter((c) => c.engine === false)) {
    const r = cast(c.date);
    assert.deepEqual(r.pillars, c.pillars, c.name);
    assert.equal(r.xiantian.name, c.xiantian);
    assert.notEqual(r.houtian.name, c.houtian, c.name);
    // 嗣龍亥月、趙必愿戌月、又命申月:俱夏至後冬至前
    const line = pureZhen(c.xiantian, c.pillars[3][1], true, false);
    assert.equal(houtian(bitsOf(c.xiantian), line), c.houtian, c.name);
  }
});

test("元堂寄位:書中七例合真數循環寄法", () => {
  for (const e of D.yuantang.examples) assert.equal(yuantangZhen(bitsOf(e.hex), e.hour), e.line, `${e.hex}${e.hour}`);
});

test("時卦第二法即月卦推法;亥時印比為刻誤", () => {
  const m = D.hourHex.methods[1].example;
  assert.deepEqual(heluoMonths(bitsOf(m.hex), m.line).map((x) => name(x.bits)), m.hours);
});

test("八卦遊年:56 格合變爻定名", () => {
  const T = { 乾: "111", 兌: "110", 離: "101", 震: "100", 巽: "011", 坎: "010", 艮: "001", 坤: "000" }; // 由下而上
  const Y = D.youNian;
  for (const [a, row] of Object.entries(Y.table)) {
    assert.equal(Object.keys(row).length, 7);
    for (const [nm, b] of Object.entries(row)) {
      const diff = [2, 1, 0].map((i) => (T[a][i] === T[b][i] ? "0" : "1")).join(""); // 上中下
      assert.equal(Y.names[diff], nm, `${a}→${b}`);
    }
  }
});

test("八卦旺廢:各節由當令卦起按後天序輪轉", () => {
  const W = D.wangFei;
  assert.deepEqual(Object.values(W.seasons), [...W.order.slice(1), W.order[0]]);
});

test("四體八體、正對反對", () => {
  const S = D.siTi.example, b = bitsOf(S.hex);
  const fu = b.map((x) => 1 - x), yi = (x) => [x[0], x[1], x[3], x[2], x[4], x[5]];
  const hu = (x) => [...x.slice(1, 4), ...x.slice(2, 5)];
  assert.deepEqual([name(fu), name(hu(b)), name(hu(fu)), name(yi(b)), name(yi(fu))], [S.fu, S.hu, S.fuHu, S.yi, S.fuYi]);
  assert.equal(name(yi(bitsOf(D.siTi.example2.hex))), D.siTi.example2.yi);
  for (const e of D.duiFan.examples) {
    assert.equal(name([...bitsOf(e.hex)].reverse()), e.fan);
    assert.equal(name(bitsOf(e.hex).map((x) => 1 - x)), e.dui);
  }
});

test("王陽明天 8 地 42", () => {
  const w = D.numberNotes.items.find((x) => x.name === "王陽明");
  const r = cast(w.date);
  assert.deepEqual(r.pillars, w.pillars);
  assert.deepEqual([r.heaven, r.earth], [w.heaven, w.earth]);
});

test("卷中四例:先天、元堂、後天同書合;屯例只屬陽偏", async () => {
  const { heluoClasses } = await import("../dist/index.js");
  for (const c of D.juanZhong.cases.items) {
    const [y, m, d, h] = c.date;
    const input = { year: y, month: m, day: d, hour: h, gender: "男" };
    const r = castHeluo(input);
    assert.deepEqual(r.pillars, c.pillars, c.name);
    assert.deepEqual([r.heaven, r.earth, r.xiantian.name, r.yuantang], [c.heaven, c.earth, c.xiantian, c.yuantang], c.name);
    if (c.houtian) assert.equal(r.houtian.name, c.houtian, c.name);
    if (c.houtianAge) assert.equal(r.houtianAge, c.houtianAge, c.name);
    if (c.patterns) assert.deepEqual(heluoClasses(r, input).patterns, c.patterns, c.name);
  }
});

test("卷中祿數即四象策數", () => {
  assert.deepEqual(Object.values(D.juanZhong.luShu.values), [4 * 9, 4 * 7, 4 * 6, 4 * 8]);
});
