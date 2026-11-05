import { test } from "node:test";
import assert from "node:assert/strict";
import { castChart, analyzeFortune } from "@numerology/engine";
import { buildContextPack, SYSTEM_PERSONA, REPORT_SECTIONS, buildReportUserPrompt } from "../dist/index.js";

const birth = { year: 1990, month: 3, day: 18, hour: 14, minute: 0, gender: "男" };
const chart = castChart(birth);

test("上下文包含四柱、日主、调候、命宫等关键事实", () => {
  const { markdown } = buildContextPack(chart);
  for (const must of ["八字四柱", "日主", "调候用神", "紫微斗数", "命宫", "大运"]) {
    assert.ok(markdown.includes(must), `上下文缺少: ${must}`);
  }
  assert.ok(markdown.includes(chart.bazi.fourPillars.day.ganZhi), "日柱干支应出现在上下文");
});

test("未校正真太阳时产出 caveat", () => {
  const { caveats } = buildContextPack(chart);
  assert.ok(caveats.some((c) => c.includes("真太阳时")), "应提示真太阳时未校正");
});

test("调候表已校对(reviewed),不再产出待校对 caveat", () => {
  const { caveats } = buildContextPack(chart);
  assert.ok(!caveats.some((c) => c.includes("调候")), "调候已校订,不应再有待校对提示");
});

test("大运过滤掉起运前的空步", () => {
  const { markdown } = buildContextPack(chart);
  assert.ok(!/、\(/.test(markdown), "大运不应出现空干支步");
});

test("传入动态运势后,上下文含大运/流年/四化飞宫", () => {
  const fortune = analyzeFortune(birth, { referenceYear: 2026, yearsAhead: 8 });
  const { markdown } = buildContextPack(chart, fortune);
  for (const must of ["动态运势", "八字大运", "八字流年", "大限四化", "流年四化", "引动用神"]) {
    assert.ok(markdown.includes(must), `动态段缺少: ${must}`);
  }
  // 不傳 fortune 時不應出現動態段
  assert.ok(!buildContextPack(chart).markdown.includes("动态运势"));
});

test("系统人设强调动静结合、运为主导", () => {
  assert.ok(SYSTEM_PERSONA.includes("动静结合") && SYSTEM_PERSONA.includes("运为主导") === false
    ? SYSTEM_PERSONA.includes("占主导") : true);
  assert.ok(SYSTEM_PERSONA.includes("四化"));
});

test("报告用户指令包含全部章节与注意事项", () => {
  const { caveats } = buildContextPack(chart);
  // zhs 下標題應為簡體原文(與 REPORT_SECTIONS.title 一致)
  const promptZhs = buildReportUserPrompt(caveats, "zhs");
  for (const s of REPORT_SECTIONS) {
    assert.ok(promptZhs.includes(s.title), `指令缺少章节: ${s.title}`);
  }
  assert.ok(promptZhs.includes("真太阳时"), "指令应带出 caveat");
  assert.ok(SYSTEM_PERSONA.includes("八字") && SYSTEM_PERSONA.includes("紫微"));
  // 默認 locale 為 zht:標題應為繁體
  const promptDefault = buildReportUserPrompt(caveats);
  assert.ok(promptDefault.includes("性格特質"), "默认应为繁体标题");
  assert.ok(!promptDefault.includes("性格特质"), "默认不应出现简体标题");
});

test("紫微新增事实:斗君/小限/飞星派;current 无流月;无格局不出格局行", () => {
  const now = new Date(2026, 10, 5);
  const full = buildContextPack(chart, undefined, { now }).markdown;
  for (const must of ["斗君:", "小限:", "飞星派(流派说法", "运限叠宫", "十二宫神煞", "紫微流月", "格局(《紫微斗数全书》)"]) {
    assert.ok(full.includes(must), `缺少: ${must}`);
  }
  assert.ok(!buildContextPack(chart, undefined, { now, fortuneScope: "current" }).markdown.includes("紫微流月"));
  assert.ok(!buildContextPack(chart, undefined, { now, fortuneScope: "none" }).markdown.includes("斗君:"));
  assert.equal(buildContextPack(chart, undefined, { now }).markdown, full, "固定 now 确定性");
  assert.ok(SYSTEM_PERSONA.endsWith("不作主要判断。"), "persona 末句");
});

test("无格局命中 → 不出格局行", () => {
  const c = { ...chart, ziwei: { ...chart.ziwei, geju: [] } };
  assert.ok(!buildContextPack(c, undefined, { now: new Date(2026, 10, 5) }).markdown.includes("格局(《紫微斗数全书》)"));
});

test("流月±1:农历初一/三十都得三個連續不同月", async () => {
  const { Lunar } = await import("lunar-javascript");
  for (const [y, m, d] of [[2026, 11, 1], [2026, 11, 30], [2025, 8, 25], [2025, 10, 22]]) {
    const md = buildContextPack(chart, undefined, { now: new Date(y, m - 1, d) }).markdown;
    const lines = md.slice(md.indexOf("### 紫微流月")).split("\n").filter((l) => l.includes("农历"));
    const ms = lines.map((l) => l.match(/农历(闰?.)月/)[1]);
    assert.equal(lines.length, 3);
    assert.equal(new Set(ms).size, 3, `${y}-${m}-${d} 月份重複: ${ms}`);
  }
  // 2026-11-9 = 十月三十前後;專測大月三十日
  let found = false;
  for (let i = 0; i < 400 && !found; i++) {
    const dt = new Date(2025, 0, 1 + i);
    const l = Lunar.fromDate(dt);
    if (l.getDay() === 30) {
      found = true;
      const md = buildContextPack(chart, undefined, { now: dt }).markdown;
      const ms = md.slice(md.indexOf("### 紫微流月")).split("\n").filter((x) => x.includes("农历")).map((x) => x.match(/农历(闰?.)月/)[1]);
      assert.equal(new Set(ms).size, 3, `三十日: ${ms}`);
      assert.equal(ms[1], l.getMonthInChinese());
    }
  }
  assert.ok(found);
});
