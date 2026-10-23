import { test } from "node:test";
import assert from "node:assert/strict";
import {
  yearGanZhi, wuxingCount, luckSteps, stepYears, currentLuckStep,
  HIDE_GAN, useGodSignal, wuxingHiddenCount, ganWuXing,
} from "../test-dist/ganzhi.js";
import { dizhiHideGan, analyzeFortune, castChart } from "@numerology/engine";

test("yearGanZhi:已知年份干支", () => {
  assert.equal(yearGanZhi(1984), "甲子");
  assert.equal(yearGanZhi(1990), "庚午");
  assert.equal(yearGanZhi(2026), "丙午");
  assert.equal(yearGanZhi(2043), "癸亥");
});

test("wuxingCount:四柱 8 字五行計數", () => {
  const pillars = [
    { gan: "庚", zhi: "午" },
    { gan: "甲", zhi: "申" },
    { gan: "丙", zhi: "寅" },
    { gan: "乙", zhi: "未" },
  ];
  assert.deepEqual(wuxingCount(pillars), { 木: 3, 火: 2, 土: 1, 金: 2, 水: 0 });
});

const bazi = {
  daYun: [
    { ganZhi: "", startAge: 1, endAge: 2, startYear: 1990 },
    { ganZhi: "乙酉", startAge: 3, endAge: 12, startYear: 1992 },
    { ganZhi: "丙戌", startAge: 13, endAge: 22, startYear: 2002 },
  ],
};

test("luckSteps:去掉起運前空干支", () => {
  assert.deepEqual(luckSteps(bazi).map((d) => d.ganZhi), ["乙酉", "丙戌"]);
});

test("stepYears:每步大運 10 年", () => {
  const ys = stepYears(bazi.daYun[1]);
  assert.equal(ys.length, 10);
  assert.equal(ys[0], 1992);
  assert.equal(ys[9], 2001);
});

test("HIDE_GAN 與引擎 dizhiHideGan 逐支一致(防漂移)", () => {
  for (const z of "子丑寅卯辰巳午未申酉戌亥") assert.deepEqual([...HIDE_GAN[z]], dizhiHideGan(z), z);
});

test("useGodSignal:天干透出 2、藏干 1、無 0", () => {
  assert.equal(useGodSignal("丙子", ["丙", "癸"]), 2);
  assert.equal(useGodSignal("甲子", ["丙", "癸"]), 1); // 子藏癸
  assert.equal(useGodSignal("庚申", ["丙", "癸"]), 0);
});

test("useGodSignal>0 ⇔ 引擎 suppliesUseGod(大運 + 流年)", () => {
  const input = { year: 1990, month: 6, day: 15, hour: 10, minute: 30, gender: "男" };
  const chart = castChart(input);
  const f = analyzeFortune(input, { referenceYear: 2026, yearsBack: 5, yearsAhead: 8 });
  const ug = chart.bazi.tiaohou.useGods;
  for (const d of f.bazi.daYun) assert.equal(useGodSignal(d.ganZhi, ug) > 0, d.suppliesUseGod, d.ganZhi);
  for (const y of f.bazi.liuNian) assert.equal(useGodSignal(y.ganZhi, ug) > 0, y.suppliesUseGod, String(y.year));
});

test("wuxingHiddenCount / ganWuXing", () => {
  assert.deepEqual(wuxingHiddenCount([{ hideGan: ["己", "癸", "辛"] }, { hideGan: ["乙"] }]), { 木: 1, 火: 0, 土: 1, 金: 1, 水: 1 });
  assert.equal(ganWuXing("壬"), "水");
  assert.equal(ganWuXing("X"), undefined);
});

test("currentLuckStep:按年份定位,範圍外 undefined", () => {
  assert.equal(currentLuckStep(bazi, 2001)?.ganZhi, "乙酉");
  assert.equal(currentLuckStep(bazi, 2002)?.ganZhi, "丙戌");
  assert.equal(currentLuckStep(bazi, 1990), undefined);
  assert.equal(currentLuckStep(bazi, 2030), undefined);
});
