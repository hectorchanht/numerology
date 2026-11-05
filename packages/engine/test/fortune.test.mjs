import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeFortune } from "../dist/index.js";

const SAMPLE = { year: 1990, month: 3, day: 18, hour: 9, minute: 30, gender: "男" };
const f = analyzeFortune(SAMPLE, { referenceYear: 2026, yearsAhead: 8 });

test("大运:当前运唯一,每步十神有效、引动判定为布尔", () => {
  assert.ok(f.bazi.daYun.length >= 8);
  assert.equal(f.bazi.daYun.filter((d) => d.isCurrent).length, 1, "referenceYear 应恰好落在一步大运");
  for (const d of f.bazi.daYun) {
    assert.ok(d.ganShiShen.length >= 2, "大运天干十神应有效");
    assert.equal(typeof d.suppliesUseGod, "boolean");
  }
});

test("流年:窗口覆盖参考年起 9 年,且唯一标注参考年", () => {
  const years = f.bazi.liuNian.map((y) => y.year);
  assert.ok(years.includes(2026) && years.includes(2034));
  assert.equal(f.bazi.liuNian.filter((y) => y.isReference).length, 1);
  assert.equal(f.bazi.liuNian.find((y) => y.isReference).year, 2026);
});

test("紫微流年四化:2026 有禄权科忌四化,且各落入本命某宫", () => {
  const y = f.ziwei.yearly.find((y) => y.year === 2026);
  assert.ok(y);
  assert.equal(y.sihua.length, 4);
  assert.deepEqual(y.sihua.map((s) => s.type).slice().sort(), ["权", "科", "忌", "禄"].sort());
  for (const s of y.sihua) {
    assert.ok(s.intoPalace && s.intoPalace !== "未入盘", "四化应落在某本命宫");
  }
});

test("大限四化结构完整(禄权科忌各一)", () => {
  assert.deepEqual(f.ziwei.decadal.sihua.map((s) => s.type).slice().sort(), ["权", "科", "忌", "禄"].sort());
});

test("小運、流月、歲運關係", () => {
  const S = { year: 1990, month: 5, day: 15, hour: 14, minute: 30, gender: "男" };
  const a = analyzeFortune(S, { referenceYear: 2017 });
  assert.equal(a.bazi.liuYue.length, 12);
  assert.equal(
    a.bazi.liuYue.map((m) => m.ganZhi).join(" "),
    "壬寅 癸卯 甲辰 乙巳 丙午 丁未 戊申 己酉 庚戌 辛亥 壬子 癸丑",
  );
  const g = analyzeFortune(S, { referenceYear: 1991, yearsBack: 1 });
  assert.deepEqual(g.bazi.xiaoYun.slice(0, 3), [
    { year: 1990, age: 1, ganZhi: "甲申" }, { year: 1991, age: 2, ganZhi: "乙酉" }, { year: 1992, age: 3, ganZhi: "丙戌" },
  ]);
  assert.deepEqual(analyzeFortune(S, { referenceYear: 1980 }).bazi.liuYue, []);
  for (const d of a.bazi.daYun) {
    assert.ok(Array.isArray(d.relations) && Array.isArray(d.tianKeDiChong));
  }
  for (const y of a.bazi.liuNian) {
    assert.ok(Array.isArray(y.relations) && Array.isArray(y.tianKeDiChong));
    assert.equal(typeof y.suiYunBingLin, "boolean");
  }
});
