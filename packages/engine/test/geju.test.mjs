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
