import { test } from "node:test";
import assert from "node:assert/strict";
import { yearGanZhi, wuxingCount, luckSteps, stepYears, currentLuckStep } from "../test-dist/ganzhi.js";

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

test("currentLuckStep:按年份定位,範圍外 undefined", () => {
  assert.equal(currentLuckStep(bazi, 2001)?.ganZhi, "乙酉");
  assert.equal(currentLuckStep(bazi, 2002)?.ganZhi, "丙戌");
  assert.equal(currentLuckStep(bazi, 1990), undefined);
  assert.equal(currentLuckStep(bazi, 2030), undefined);
});
