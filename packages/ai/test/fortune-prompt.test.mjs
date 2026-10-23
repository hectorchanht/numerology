import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FORTUNE_SEGMENTS,
  buildFortuneSectionPrompt,
  buildFortuneReportPrompt,
  fixFortuneHeadings,
} from "../dist/index.js";

const seg = (key) => FORTUNE_SEGMENTS.find((s) => s.key === key);

/** 最小 FortuneAnalysis 夹具:够渲染小标题清单即可。 */
const fortuneFixture = {
  referenceYear: 2026,
  bazi: {
    daYun: [
      { ganZhi: "甲寅", startAge: 2, endAge: 11, startYear: 1995, endYear: 2004 },
      { ganZhi: "癸丑", startAge: 12, endAge: 21, startYear: 2005, endYear: 2014 },
    ],
    liuNian: [
      { year: 2021, age: 28, ganZhi: "辛丑", isPast: true, isReference: false },
      { year: 2026, age: 33, ganZhi: "丙午", isPast: false, isReference: true },
      { year: 2027, age: 34, ganZhi: "丁未", isPast: false, isReference: false },
    ],
  },
};

test("分段 prompt 含数字铁律(禁占位符,不再给占位符形状示例)", () => {
  for (const s of FORTUNE_SEGMENTS) {
    const p = buildFortuneSectionPrompt([], s, "both", "zht");
    assert.ok(p.includes("原样照抄"), `${s.key} 缺少数字铁律`);
    assert.ok(p.includes("严禁在小标题里用任何占位符号"), `${s.key} 缺少占位符禁令`);
    assert.ok(!p.includes("甲寅運（–歲／–年）"), `${s.key} 不应再给出占位符形状示例(模型会照抄形状)`);
  }
});

test("整篇 prompt 含数字铁律", () => {
  const p = buildFortuneReportPrompt([], "zht");
  assert.ok(p.includes("原样照抄"), "整篇 prompt 缺少数字铁律");
  assert.ok(p.includes("严禁在小标题里用任何占位符号"), "整篇 prompt 缺少占位符禁令");
});

test("小标题清单:dayun/review/future 按节渲染成品行(zht)", () => {
  const dayun = buildFortuneSectionPrompt([], seg("dayun"), "both", "zht", fortuneFixture);
  assert.ok(dayun.includes("### 甲寅運（2–11歲／1995–2004年）"), "dayun 应有小标题清单");
  assert.ok(dayun.includes("### 甲寅運（2–11歲／1995–2004年）"), "dayun 清单应含第一步成品行");
  assert.ok(dayun.includes("### 癸丑運（12–21歲／2005–2014年）"), "dayun 清单应含第二步成品行");

  const review = buildFortuneSectionPrompt([], seg("review"), "both", "zht", fortuneFixture);
  assert.ok(review.includes("### 2021年（辛丑，28歲）"), "review 清单只含已过年份");
  assert.ok(!review.includes("2027年"), "review 清单不应含未来年份");

  const future = buildFortuneSectionPrompt([], seg("future"), "both", "zht", fortuneFixture);
  assert.ok(future.includes("### 2026年（丙午，33歲）"), "future 清单含参考年");
  assert.ok(future.includes("### 2027年（丁未，34歲）"), "future 清单含未来年份");
  assert.ok(!future.includes("2021年（辛丑"), "future 清单不应含已过年份");

  const rhythm = buildFortuneSectionPrompt([], seg("rhythm"), "both", "zht", fortuneFixture);
  assert.ok(!rhythm.includes("### 癸丑運（12–21歲"), "rhythm 不需要小标题清单");
});

test("小标题清单:zhs/en 本地化", () => {
  const zhs = buildFortuneSectionPrompt([], seg("dayun"), "both", "zhs", fortuneFixture);
  assert.ok(zhs.includes("### 甲寅运（2–11岁／1995–2004年）"), "zhs 清单用简体");
  const en = buildFortuneSectionPrompt([], seg("dayun"), "both", "en", fortuneFixture);
  assert.ok(en.includes("### 甲寅 Luck Period (ages 2–11 / 1995–2004)"), "en 清单保留干支汉字");
  const enYear = buildFortuneSectionPrompt([], seg("future"), "both", "en", fortuneFixture);
  assert.ok(enYear.includes("### 2026 (丙午, age 33)"), "en 流年清单格式");
});

test("整篇 prompt 含三节小标题清单", () => {
  const p = buildFortuneReportPrompt([], "zht", fortuneFixture);
  assert.ok(p.includes("### 甲寅運（2–11歲／1995–2004年）"), "整篇应含 dayun 清单");
  assert.ok(p.includes("### 2021年（辛丑，28歲）"), "整篇应含 review 清单");
  assert.ok(p.includes("### 2027年（丁未，34歲）"), "整篇应含 future 清单");
});

test("无 fortune 参数时不渲染清单(向后兼容)", () => {
  const p = buildFortuneSectionPrompt([], seg("dayun"), "both", "zht");
  assert.ok(!p.includes("### 甲寅運（2–11歲"), "无 fortune 时不应有清单成品行");
  assert.ok(p.includes("原样照抄"), "数字铁律仍在");
});

test("fixFortuneHeadings:占位符小标题被修复为成品行", () => {
  const bad = [
    "## 二、大運逐步精講",
    "",
    "### 甲寅運（–歲／–年）",
    "",
    "正文第一段。",
    "### 癸丑運（- 歲/-）",
    "",
    "正文第二段。",
  ].join("\n");
  const fixed = fixFortuneHeadings(bad, fortuneFixture, "zht");
  assert.ok(fixed.includes("### 甲寅運（2–11歲／1995–2004年）"), "en dash 占位应被修复");
  assert.ok(fixed.includes("### 癸丑運（12–21歲／2005–2014年）"), "连字符占位应被修复");
  assert.ok(fixed.includes("## 二、大運逐步精講"), "节标题(## )不应被碰");
  assert.ok(fixed.includes("正文第一段。"), "正文不应被碰");
  assert.ok(!fixed.includes("–歲／–年"), "修复后不应残留占位符");
});

test("fixFortuneHeadings:已写对的行保持不变,未知干支/年份不动", () => {
  const good = "### 甲寅運（2–11歲／1995–2004年）\n### 丙寅運（1–2歲）\n### 1999年（己卯，1歲）\n普通正文。";
  const fixed = fixFortuneHeadings(good, fortuneFixture, "zht");
  assert.ok(fixed.includes("### 甲寅運（2–11歲／1995–2004年）"), "已写对的行不变");
  assert.ok(fixed.includes("### 丙寅運（1–2歲）"), "清单里没有的干支不动");
  assert.ok(fixed.includes("### 1999年（己卯，1歲）"), "清单里没有的年份不动");
  assert.ok(fixed.includes("普通正文。"), "正文不动");
});

test("fixFortuneHeadings:流年占位符也被修复(zhs/en)", () => {
  const bad = "### 2021年（–，–歲）";
  const zhs = fixFortuneHeadings(bad, fortuneFixture, "zhs");
  assert.ok(zhs.includes("### 2021年（辛丑，28岁）"), "zhs 流年应被修复");
  const enBad = "### 2026 (—, age —)";
  const en = fixFortuneHeadings(enBad, fortuneFixture, "en");
  assert.ok(en.includes("### 2026 (丙午, age 33)"), "en 流年应被修复");
  const enDayun = fixFortuneHeadings("### 甲寅 Luck Period (ages – / –)", fortuneFixture, "en");
  assert.ok(enDayun.includes("### 甲寅 Luck Period (ages 2–11 / 1995–2004)"), "en 大运应被修复");
});

test("dayun 节:同期大限 + 3–4 句 + 禁重复句式", () => {
  const p = buildFortuneSectionPrompt([], seg("dayun"), "both", "zht");
  assert.ok(p.includes("同期大限"), "dayun 应要求看每步同期大限");
  assert.ok(p.includes("3–4 句"), "dayun 应限制每步 3–4 句");
  assert.ok(p.includes("严禁"), "dayun 应有严禁重复句式的纪律");
});

test("dayun 节:点名禁止 live 观测到的机械行为", () => {
  const p = buildFortuneSectionPrompt([], seg("dayun"), "both", "zht");
  assert.ok(p.includes("机械复述"), "应禁支藏十神的机械合刑冲复述");
  assert.ok(p.includes("逐个报一遍"), "应禁禄权科忌飞宫逐个播报");
  assert.ok(p.includes("换切入点"), "应禁固定句式、要求各步换切入点");
  assert.ok(p.includes("轮换"), "应禁定性句在顺利/平稳/挑战里轮换");
  assert.ok(p.includes("原料不是提纲"), "应要求上下文是原料不是提纲");
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
  assert.ok(en.includes("原样照抄"), "英文 locale 下数字铁律仍在");
});

test("表达风格规则:一句话定性 + 禁废话开场 + 断语纪律", () => {
  const p = buildFortuneSectionPrompt([], seg("dayun"), "both", "zht");
  assert.ok(p.includes("一句话定性"), "应要求每步/每年先一句话定性");
  assert.ok(p.includes("值得注意的是"), "应列出禁止的废话开场");
  assert.ok(p.includes("绝不编造古籍断语"), "应有断语纪律");
  assert.ok(p.includes("传统有此一说"), "传统说法必须标注口径");
  const full = buildFortuneReportPrompt([], "zht");
  assert.ok(full.includes("一句话定性"), "整篇 prompt 也应有风格规则");
  assert.ok(full.includes("绝不编造古籍断语"), "整篇 prompt 也应有断语纪律");
});
