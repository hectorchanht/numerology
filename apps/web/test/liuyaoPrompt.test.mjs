import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLiuyaoUserText, liuyaoSystemPrompt } from "../test-dist/liuyaoPrompt.js";

/** 假納甲盤:乾為天,初九動 */
const fakeResult = {
  bits: [1, 1, 1, 1, 1, 1],
  lowerTrigram: "乾",
  upperTrigram: "乾",
  palace: "乾",
  palaceWuxing: "金",
  shape: "六沖",
  shi: 1,
  ying: 4,
  dayGanzhi: "甲子",
  monthBranch: "寅",
  kong: ["戌", "亥"],
  yaos: [
    { position: 1, value: 9, yinYang: "陽", moving: true, stem: "甲", branch: "子", ganzhi: "甲子", wuxing: "水", qin: "子孫", shiYing: "世", beast: "青龍", xunKong: false, yuePo: false, riPo: false },
    { position: 2, value: 7, yinYang: "陽", moving: false, stem: "甲", branch: "寅", ganzhi: "甲寅", wuxing: "木", qin: "妻財", shiYing: "", beast: "朱雀", xunKong: false, yuePo: false, riPo: false },
    { position: 3, value: 7, yinYang: "陽", moving: false, stem: "甲", branch: "辰", ganzhi: "甲辰", wuxing: "土", qin: "父母", shiYing: "", beast: "勾陳", xunKong: false, yuePo: false, riPo: false },
    { position: 4, value: 7, yinYang: "陽", moving: false, stem: "壬", branch: "午", ganzhi: "壬午", wuxing: "火", qin: "官鬼", shiYing: "應", beast: "螣蛇", xunKong: true, yuePo: false, riPo: false },
    { position: 5, value: 7, yinYang: "陽", moving: false, stem: "壬", branch: "申", ganzhi: "壬申", wuxing: "金", qin: "父母", shiYing: "", beast: "白虎", xunKong: false, yuePo: false, riPo: true },
    { position: 6, value: 7, yinYang: "陽", moving: false, stem: "壬", branch: "戌", ganzhi: "壬戌", wuxing: "土", qin: "父母", shiYing: "", beast: "玄武", xunKong: false, yuePo: true, riPo: false },
  ],
};

test("liuyaoPrompt:system 要求 400 字內兩段、先給結論", () => {
  const s = liuyaoSystemPrompt();
  assert.ok(s.includes("400字以內"));
  assert.ok(s.includes("第一段第一句先給結論"));
  assert.ok(s.includes("世為己") && s.includes("動爻為事之機") && s.includes("日辰月建定旺衰"));
  assert.ok(s.includes("旬空、月破、日破者無力"));
});

test("liuyaoPrompt:user 文本含本卦/變卦/納甲/動爻/日月", () => {
  const t = buildLiuyaoUserText({
    benName: "䷀ 乾",
    benNumber: 1,
    bianName: "䷫ 姤",
    r: fakeResult,
    locale: "zht",
  });
  assert.ok(t.includes("本卦:䷀ 乾(第1卦)"));
  assert.ok(t.includes("變卦:䷫ 姤"));
  assert.ok(t.includes("1爻動"));
  assert.ok(t.includes("日辰:甲子") && t.includes("月建:寅") && t.includes("旬空:戌亥"));
  assert.ok(t.includes("1爻:甲子子孫·青龍(世·動)"));
  assert.ok(t.includes("4爻:壬午官鬼·螣蛇(應·旬空)"));
  assert.ok(t.includes("5爻:壬申父母·白虎(日破)"));
  assert.ok(t.includes("6爻:壬戌父母·玄武(月破)"));
  assert.ok(t.includes("400字以內"));
});

test("liuyaoPrompt:無動爻 → 無變卦行", () => {
  const still = { ...fakeResult, yaos: fakeResult.yaos.map((y) => ({ ...y, moving: false })) };
  const t = buildLiuyaoUserText({ benName: "䷀ 乾", benNumber: 1, r: still, locale: "zht" });
  assert.ok(t.includes("無動爻。"));
  assert.ok(!t.includes("變卦:"));
});

test("liuyaoPrompt:en locale 尾句係英文", () => {
  const t = buildLiuyaoUserText({ benName: "䷀ 乾", benNumber: 1, r: fakeResult, locale: "en" });
  assert.ok(t.includes("in English, within 400 words"));
});
