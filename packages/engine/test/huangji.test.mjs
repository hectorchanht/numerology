import { test } from "node:test";
import assert from "node:assert/strict";
import { castHuangji } from "../dist/index.js";

const at = (year, month, day, hour = 12) => castHuangji({ year, month, day, hour, minute: 0, gender: "男" });

test("2026 年年中 → 午會第 192 運第 2302 世,丙午", () => {
  const r = at(2026, 7, 1);
  assert.deepEqual([r.hui, r.huiName, r.yun, r.shi, r.ganzhi], [7, "午", 192, 2302, "丙午"]);
  assert.equal(r.ganzhiYear, 2026);
  assert.equal(r.tier, "classical");
});

test("立春前出生屬上一干支年", () => {
  const r = at(2026, 1, 20);
  assert.equal(r.ganzhi, "乙巳");
  assert.equal(r.ganzhiYear, 2025);
  assert.equal(r.yuanYear, at(2026, 7, 1).yuanYear - 1);
});

test("運、世名同序號一致;世內年 1–30", () => {
  for (const y of [1900, 1984, 2000, 2100]) {
    const r = at(y, 6, 1);
    assert.equal(r.yunName, "甲乙丙丁戊己庚辛壬癸"[(r.yun - 1) % 10]);
    assert.equal(r.shiName, "子丑寅卯辰巳午未申酉戌亥"[(r.shi - 1) % 12]);
    assert.ok(r.yearInShi >= 1 && r.yearInShi <= 30);
    assert.equal(Math.ceil(r.shi / 12), r.yun);
  }
});

test("1984 甲子年 = 某世第 1 年(元第一年甲子,單數世由甲子起)", () => {
  const r = at(1984, 6, 1);
  assert.equal(r.ganzhi, "甲子");
  assert.equal(r.yearInShi, 1);
  assert.equal(r.shi % 2, 1);
});
