import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FORTUNE_SEGMENTS,
  buildFortuneSectionPrompt,
  buildFortuneReportPrompt,
} from "../dist/index.js";

const seg = (key) => FORTUNE_SEGMENTS.find((s) => s.key === key);

test("分段 prompt 含数字铁律与禁例", () => {
  for (const s of FORTUNE_SEGMENTS) {
    const p = buildFortuneSectionPrompt([], s, "both", "zht");
    assert.ok(p.includes("逐字照抄"), `${s.key} 缺少数字铁律`);
    assert.ok(p.includes("戊辰運（- 歲/-）"), `${s.key} 缺少禁例`);
    assert.ok(p.includes("X–Y歲／YYYY–YYYY年"), `${s.key} 缺少大运标题格式`);
    assert.ok(p.includes("YYYY年（干支，Z歲）"), `${s.key} 缺少流年标题格式`);
  }
});

test("整篇 prompt 含数字铁律", () => {
  const p = buildFortuneReportPrompt([], "zht");
  assert.ok(p.includes("逐字照抄"), "整篇 prompt 缺少数字铁律");
  assert.ok(p.includes("戊辰運（- 歲/-）"), "整篇 prompt 缺少禁例");
});

test("dayun 节:同期大限 + 3–4 句 + 禁重复句式", () => {
  const p = buildFortuneSectionPrompt([], seg("dayun"), "both", "zht");
  assert.ok(p.includes("同期大限"), "dayun 应要求看每步同期大限");
  assert.ok(p.includes("3–4 句"), "dayun 应限制每步 3–4 句");
  assert.ok(p.includes("严禁"), "dayun 应有严禁重复句式的纪律");
});

test("review/future 节:2–3 句 + 禁填表模板", () => {
  for (const key of ["review", "future"]) {
    const p = buildFortuneSectionPrompt([], seg(key), "both", "zht");
    assert.ok(p.includes("2–3 句"), `${key} 应限制每年 2–3 句`);
  }
});

test("rhythm 节:只列转折点清单,禁重播", () => {
  const p = buildFortuneSectionPrompt([], seg("rhythm"), "both", "zht");
  assert.ok(p.includes("转折点清单"), "rhythm 应只列转折点清单");
});

test("去套话要求机制语言(非空话形容词)", () => {
  const p = buildFortuneSectionPrompt([], seg("dayun"), "both", "zht");
  assert.ok(p.includes("写不出机制就删掉") || p.includes("必须有信息量"), "应要求形容词带机制");
});

test("数字铁律与去套话不破坏既有纪律(locale/视角/篇幅)", () => {
  const p = buildFortuneSectionPrompt([], seg("dayun"), "both", "zht");
  assert.ok(p.includes("## 二、大運逐步精講"), "小标题仍为繁体");
  assert.ok(p.includes("只写这一节"), "仍要求只写本节");
  assert.ok(p.includes("八字 × 紫微合参"), "合参视角指令仍在");
  const en = buildFortuneSectionPrompt([], seg("dayun"), "both", "en");
  assert.ok(en.includes("## 2. Major Luck Periods in Detail"), "英文小标题仍在");
  assert.ok(en.includes("逐字照抄"), "英文 locale 下数字铁律仍在");
});
