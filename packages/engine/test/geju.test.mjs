import { test } from "node:test";
import assert from "node:assert/strict";
import { castChart, castGeju, castFuyi } from "../dist/index.js";

const NOTE = "本站按《子平真詮》月令取格簡化,不含成敗救應";
const g = (year, month, day, hour) => castChart({ year, month, day, hour, minute: 0, gender: "男" }).bazi.geju;

test("實盤取格", () => {
  for (const [args, main, basis] of [
    [[1990, 5, 15, 14], "七杀格", "本气未透"],
    [[1990, 5, 30, 11], "正官格", "中气透"],
    [[1985, 2, 10, 8], "偏印格", "余气透"],
    [[2000, 8, 20, 20], "建禄格", "禄刃"],
    [[1975, 11, 3, 4], "正官格", "本气未透"],
  ]) {
    const r = g(...args);
    assert.equal(r.main, main, args.join("-"));
    assert.equal(r.basis, basis, args.join("-"));
    assert.equal(r.note, NOTE);
    assert.equal(r.tier, "modern");
  }
});

test("阳刃格與兼格", () => {
  assert.equal(castGeju("甲", "卯", []).main, "阳刃格");
  const r = castGeju("甲", "巳", [{ pos: "year", gan: "戊" }, { pos: "hour", gan: "丙" }]);
  assert.equal(r.main, "食神格");
  assert.deepEqual(r.also, ["偏财格"]);
});

test("castChart 帶入 castFuyi 的 possibleCong", () => {
  for (const a of [[1980, 8, 5, 9], [1990, 5, 15, 14], [1985, 2, 10, 8]]) {
    const c = castChart({ year: a[0], month: a[1], day: a[2], hour: a[3], minute: 0, gender: "男" });
    assert.equal(c.bazi.geju.possibleCong, castFuyi(c).possibleCong);
  }
});

test("建祿陽刃按祿刃位取格(非本氣十神)", () => {
  for (const [dm, zhi, main] of [["戊", "巳", "建禄格"], ["己", "午", "建禄格"], ["戊", "午", "阳刃格"]]) {
    const r = castGeju(dm, zhi, []);
    assert.equal(r.main, main, dm + zhi);
    assert.equal(r.basis, "禄刃");
  }
  // 本氣為比劫但非祿刃位 → 比劫不取格,取首個非比劫藏干(本气未透)
  const a = castGeju("戊", "辰", []);
  assert.notEqual(a.main, "建禄格");
  assert.equal(a.main, "正官格");
  assert.equal(a.basis, "本气未透");
  assert.notEqual(castGeju("戊", "丑", []).main, "阳刃格");
  // 己辰、己戌:四庫雜氣,唔作月劫,比劫不取格 → 取首個非比劫藏干
  assert.equal(castGeju("己", "戌", []).main, "食神格"); // 戌藏戊辛丁,戊比劫略過,取辛
  assert.equal(castGeju("己", "辰", []).main, "七杀格"); // 辰藏戊乙癸,取乙
  assert.equal(castGeju("乙", "寅", []).main, "月劫格");
  const b = castGeju("己", "未", []);
  assert.notEqual(b.main, "建禄格");
  assert.equal(b.basis, "本气未透");
});
