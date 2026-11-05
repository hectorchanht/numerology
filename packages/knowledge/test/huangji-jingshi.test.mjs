import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const H = JSON.parse(readFileSync(new URL("../data/huangji-jingshi.json", import.meta.url), "utf8"));
const STEM = "甲乙丙丁戊己庚辛壬癸";
const BRANCH = "子丑寅卯辰巳午未申酉戌亥";
const gz = (i) => STEM[i % 10] + BRANCH[i % 12]; // i 由 0 起,0 = 甲子

const yao = H.anchors.find((a) => a.label === "唐堯元年");
const yaoIndex = (yao.shi - 1) * 30 + yao.yearInShi; // 元內第幾年(1 起)
// 公元(天文紀年)→ 元內年序
const yearOf = (ad) => yaoIndex + (ad - yao.ad);
const pos = (y) => ({ hui: Math.ceil(y / 10800), yun: Math.ceil(y / 360), shi: Math.ceil(y / 30) });

test("一元 = 12 會 × 30 運 × 12 世 × 30 年 = 129600 年", () => {
  const u = H.units;
  assert.equal(u.yuan.hui * u.hui.yun * u.yun.shi * u.shi.years, H.units.yearsPerYuan);
});

test("錨點嘅會、運、世名同序號一致", () => {
  for (const a of H.anchors) {
    if (a.hui) assert.equal(BRANCH[a.hui - 1], a.huiName, a.label);
    if (a.yun) {
      assert.equal(STEM[(a.yun - 1) % 10], a.yunName, a.label);
      assert.equal(Math.ceil(a.yun / 30), a.hui, `${a.label} 運屬會`);
    }
    if (a.shi) {
      assert.equal(BRANCH[(a.shi - 1) % 12], a.shiName, a.label);
      assert.equal(Math.ceil(a.shi / 12), a.yun, `${a.label} 世屬運`);
    }
  }
});

test("有公元年嘅錨點:由唐堯推算,干支同會運世全部吻合", () => {
  for (const a of H.anchors.filter((x) => x.ad !== undefined)) {
    const y = yearOf(a.ad);
    assert.equal(gz(y - 1), a.ganzhi, a.label);
    // 公元干支獨立核對:公元 4 年 = 甲子
    assert.equal(gz((((a.ad - 4) % 60) + 60) % 60), a.ganzhi, `${a.label} 公元干支`);
    if (a.shi) assert.deepEqual(pos(y), { hui: a.hui, yun: a.yun, shi: a.shi }, a.label);
    if (a.yearInShi) assert.equal(y - (a.shi - 1) * 30, a.yearInShi, a.label);
  }
});

test("每世頭一年:單數世甲子、雙數世甲午", () => {
  for (const s of [1, 2, 2156, 2257]) assert.equal(gz((s - 1) * 30), s % 2 ? "甲子" : "甲午");
});

test("開物喺寅會、閉物喺戌會", () => {
  const open = H.anchors.find((a) => a.label === "開物"), close = H.anchors.find((a) => a.label === "閉物");
  assert.ok(open.yun > 60 && open.yun <= 90);
  assert.ok(close.yun > 300 && close.yun <= 330);
});

test("外篇:每級係上一級嘅平方;卦數逐級乘 360、129600", () => {
  const v = H.squares.values;
  for (let i = 1; i < v.length; i++) assert.equal(v[i], v[i - 1] ** 2);
  const g = H.hexagramScale.items.map((x) => x.value);
  assert.deepEqual([g[0] * 360, g[1] * 129600], [g[1], g[2]]);
});

test("公元 2026 年 = 午會第 192 運", () => {
  assert.deepEqual(pos(yearOf(2026)), { hui: 7, yun: 192, shi: 2302 });
});
