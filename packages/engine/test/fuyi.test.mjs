import { test } from "node:test";
import assert from "node:assert/strict";
import { castChart, castFuyi } from "../dist/index.js";

const fy = (year, month, day, hour) => castFuyi(castChart({ year, month, day, hour, minute: 0, gender: "男" }));

// 手算規則:得令 月支本氣 扶 +3/抑 −3;得地 藏干 本氣 1、中氣 0.5、餘氣 0.3(月支只計中餘氣);得勢 年月時干 ±1。

test("明顯身強:庚申 癸未 庚戌 辛巳(日主庚金)", () => {
  // 得令:未本氣己土=印 +3
  // 得地:申 庚+1 壬−0.5 戊+0.3;未(月) 丁−0.5 乙−0.3;戌 戊+1 辛+0.5 丁−0.3;巳 丙−1 庚+0.5 戊+0.3 → +1
  // 得勢:庚+1 癸−1 辛+1 → +1
  // 總分 3 + 1 + 1 = +5 → 身強
  const r = fy(1980, 8, 5, 9);
  assert.equal(r.score, 5);
  assert.equal(r.verdict, "strong");
  assert.deepEqual(r.favorable, ["水", "木", "火"]);
  assert.deepEqual(r.unfavorable, ["土", "金"]);
  assert.ok(!r.favorable.includes("金"));
  assert.equal(r.possibleCong, false);
  assert.equal(r.tier, "modern");
  for (const k of ["得令", "得地", "得勢", "本站簡化評分,非古籍原文"]) assert.ok(r.steps.some((s) => s.includes(k)), k);
  assert.ok(r.steps.some((s) => s.includes("得令") && s.includes("+3")));
});

test("明顯身弱:己未 丙子 丁丑 丁未(日主丁火)", () => {
  // 得令:子本氣癸水=官殺 −3
  // 得地:未 己−1 丁+0.5 乙+0.3;丑(日) 己−1 癸−0.5 辛−0.3;未(時) 己−1 丁+0.5 乙+0.3 → −2.2
  // 得勢:己−1 丙+1 丁+1 → +1
  // 總分 −3 − 2.2 + 1 = −4.2 → 身弱
  const r = fy(1980, 1, 5, 13);
  assert.equal(r.score, -4.2);
  assert.equal(r.verdict, "weak");
  assert.deepEqual(r.favorable, ["木", "火"]); // 印、比劫
  assert.deepEqual(r.unfavorable, ["水", "土", "金"]);
  assert.equal(r.possibleCong, false);
});

test("中和:庚申 庚辰 戊申 己未(日主戊土)", () => {
  // 得令:辰本氣戊土=比劫 +3
  // 得地:申 庚−1 壬−0.5 戊+0.3;辰(月) 乙−0.5 癸−0.3;申 庚−1 壬−0.5 戊+0.3;未 己+1 丁+0.5 乙−0.3 → −2
  // 得勢:庚−1 庚−1 己+1 → −1
  // 總分 3 − 2 − 1 = 0 → 中和
  const r = fy(1980, 4, 5, 13);
  assert.equal(r.score, 0);
  assert.equal(r.verdict, "neutral");
  assert.deepEqual(r.favorable, []);
  assert.deepEqual(r.unfavorable, []);
  assert.ok(r.steps.some((s) => s.includes("中和,以調候為參")));
});

test("可能從格(≤ −6):己未 丙子 丁丑 辛丑(日主丁火)", () => {
  // 得令:子本氣癸水=官殺 −3
  // 得地:未 己−1 丁+0.5 乙+0.3;丑 己−1 癸−0.5 辛−0.3;丑 己−1 癸−0.5 辛−0.3 → −3.8
  // 得勢:己−1 丙+1 辛−1 → −1
  // 總分 −3 − 3.8 − 1 = −7.8 → 身弱、可能從格
  const r = fy(1980, 1, 5, 1);
  assert.equal(r.score, -7.8);
  assert.equal(r.verdict, "weak");
  assert.equal(r.possibleCong, true);
  assert.ok(r.steps.some((s) => s.includes("可能從格")));
});

test("可能從格(≥ +6):庚申 乙酉 辛丑 己丑(日主辛金)", () => {
  // 得令:酉本氣辛金=比劫 +3
  // 得地:申 庚+1 壬−0.5 戊+0.3;丑 己+1 癸−0.5 辛+0.3;丑 己+1 癸−0.5 辛+0.3 → +2.4
  // 得勢:庚+1 乙−1 己+1 → +1
  // 總分 3 + 2.4 + 1 = +6.4 → 身強、可能從格
  const r = fy(1980, 9, 25, 1);
  assert.equal(r.score, 6.4);
  assert.equal(r.verdict, "strong");
  assert.equal(r.possibleCong, true);
});
