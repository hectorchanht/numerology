import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { allHexagrams } from "@numerology/knowledge";
import { castHeluo, heluoMonths, heluoYuantangZhen } from "../dist/index.js";

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

const yuantangZhen = (bits, hour) => heluoYuantangZhen(bits, BR.indexOf(hour), true, true);
const pureZhen = (hexName, hour, male, yangSeason) => heluoYuantangZhen(bitsOf(hexName), BR.indexOf(hour), male, yangSeason);

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

test("卷下七十二候:卦序同 guaqi,冬至頤四;中氣值卿卦四爻、節值侯卦初爻", () => {
  const G = JSON.parse(readFileSync(new URL("../../knowledge/data/heluo-lishu.json", import.meta.url), "utf8")).guaqi.months;
  const order = ["大雪", "小寒", "立春", "驚蟄", "清明", "立夏", "芒種", "小暑", "立秋", "白露", "寒露", "立冬"];
  const flat = order.flatMap((m) => G[m]);
  const seq = [...flat.slice(2), ...flat.slice(0, 2)];
  const Q = D.juanXia.qihou;
  assert.equal(seq[0], Q.start.hex);
  const at = (n) => ({ hex: seq[Math.floor((n + 3) / 6) % 60], line: ((n + 3) % 6) + 1 });
  assert.deepEqual(at(0), Q.start);
  for (let k = 0; k < 12; k++) {
    assert.deepEqual(at(30 * k), { hex: G[order[k]][2], line: 4 }); // 中氣
    assert.deepEqual(at(15 + 30 * k), { hex: G[order[(k + 1) % 12]][0], line: 1 }); // 節
  }
});

test("卷下先天策數:中孚上九 12685、睽九二 4423", () => {
  const XT = { 111: 1, 110: 2, 101: 3, 100: 4, "011": 5, "010": 6, "001": 7, "000": 8 };
  const ce = (bits, k) => {
    const Z = bits.reduce((s, b) => s + (b ? 36 : 24), 0);
    const L = XT[bits.slice(0, 3).join("")], U = XT[bits.slice(3).join("")];
    return k > 3 ? 10 * k * Z + U * Z + Z + U + L + k : 10 * L * Z + k * Z + Z + U + L + k;
  };
  for (const e of D.juanXia.ceShu.examples) assert.equal(ce(bitsOf(e.hex), e.line), e.value, e.hex);
});

test("卷下伊川僕例:乾九四,十九歲流年仍乾", () => {
  const c = D.juanXia.cases[0];
  const r = cast(c.date);
  assert.deepEqual(r.pillars, c.pillars);
  assert.deepEqual([r.heaven, r.xiantian.name, r.yuantang], [c.heaven, c.xiantian, c.yuantang]);
  assert.equal(r.liunian.find((y) => y.age === c.age).hex.name, c.liunian);
});

test("易卦釋義宮世月:合京房八宮同世爻月建,萃卦三世為刻誤", () => {
  const T = { 乾: "111", 兌: "110", 離: "101", 震: "100", 巽: "011", 坎: "010", 艮: "001", 坤: "000" }; // 由下而上
  const CN = ["", "一", "二", "三", "四", "五", "六"];
  const PAL = {};
  for (const [p, t] of Object.entries(T)) {
    let b = [...t + t].map(Number);
    PAL[b.join("")] = [p, 6];
    for (let i = 0; i < 5; i++) (b = b.slice()), (b[i] ^= 1), (PAL[b.join("")] = [p, i + 1]);
    b = b.slice(); b[3] ^= 1; PAL[b.join("")] = [p, 4]; // 遊魂
    PAL[[...t].map(Number).concat(b.slice(3)).join("")] = [p, 3]; // 歸魂
  }
  const items = D.shiyi.palace.items;
  assert.equal(items.length, 53);
  for (const c of items) {
    const b = bitsOf(c.hex.replace("无", "無"));
    const [p, s] = PAL[b.join("")];
    assert.equal(c.palace, p, c.hex);
    if (!c.erratum) assert.equal(c.shi, CN[s], c.hex);
    // 陽世由子月(十一月)、陰世由午月(五月)起初爻
    if (c.month) assert.equal(c.month, b[s - 1] ? ((9 + s) % 12) + 1 : ((3 + s) % 12) + 1, c.hex);
  }
});

test("castHeluo 附真數寄位:三個純卦局真數元堂所得後天同書合", () => {
  for (const c of D.cases.items.filter((c) => c.engine === false)) {
    const z = cast(c.date).zhenshu;
    assert.equal(z.same, false, c.name);
    assert.equal(z.houtian.name, c.houtian, c.name);
  }
  for (const c of D.cases.items.filter((c) => c.engine === true)) assert.equal(cast(c.date).zhenshu.houtian.name, c.houtian, c.name);
});
