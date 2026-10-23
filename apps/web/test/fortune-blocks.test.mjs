import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseVerdictAnalysis,
  parseEvidenceBlock,
  parseRhythmItems,
  splitDayunSteps,
  splitYearBlocks,
} from "../test-dist/fortuneBlocks.js";

test("parseVerdictAnalysis:雙標記照切", () => {
  const r = parseVerdictAnalysis("【定性】先抑後揚的翻身運。\n\n【分析】這步運事業先蹇後通。忌星入官祿,前段承壓。");
  assert.equal(r.verdict, "先抑後揚的翻身運。");
  assert.equal(r.analysis, "這步運事業先蹇後通。忌星入官祿,前段承壓。");
});

test("parseVerdictAnalysis:只有定性標記 → 首句定性", () => {
  const r = parseVerdictAnalysis("【定性】平穩守成之運。前段宜守,後段可攻。");
  assert.equal(r.verdict, "平穩守成之運。");
  assert.equal(r.analysis, "前段宜守,後段可攻。");
});

test("parseVerdictAnalysis:無標記(舊文本) → 首句定性降級", () => {
  const r = parseVerdictAnalysis("八字大运:戊辰运,天干比肩。紫微大限:甲戌。這段時期運勢順利。");
  assert.equal(r.verdict, "八字大运:戊辰运,天干比肩。");
  assert.ok(r.analysis.includes("紫微大限"));
});

test("parseVerdictAnalysis:空字串", () => {
  assert.deepEqual(parseVerdictAnalysis("  "), { verdict: "", analysis: "" });
});

test("parseEvidenceBlock:段尾依据塊切出", () => {
  const r = parseEvidenceBlock("正文第一段。\n\n【依据】\n天干比肩:得助\n化忌入夫妻:感情波動\n\n### 下一節標題");
  assert.equal(r.body, "正文第一段。");
  assert.deepEqual(r.evidence, ["天干比肩:得助", "化忌入夫妻:感情波動"]);
});

test("parseEvidenceBlock:無標記 → 原樣", () => {
  const r = parseEvidenceBlock("正文。\n\n第二段。");
  assert.equal(r.body, "正文。\n\n第二段。");
  assert.deepEqual(r.evidence, []);
});

test("parseEvidenceBlock:去列表符", () => {
  const r = parseEvidenceBlock("正文。\n【依据】\n- 天干比肩\n* 化祿入財帛");
  assert.deepEqual(r.evidence, ["天干比肩", "化祿入財帛"]);
});

test("parseRhythmItems:年份開頭逐行", () => {
  const r = parseRhythmItems("2031年:換運,進入新階段。\n2041年:換限,需謹慎。\n\n### 標題\nTL;DR:摘要");
  assert.deepEqual(r, [
    { year: 2031, text: "換運,進入新階段。" },
    { year: 2041, text: "換限,需謹慎。" },
  ]);
});

test("parseRhythmItems:非年份行照收(year=null)", () => {
  const r = parseRhythmItems("未來十年整體向上。");
  assert.deepEqual(r, [{ year: null, text: "未來十年整體向上。" }]);
});

test("splitDayunSteps:按干支小標題切塊", () => {
  const md = [
    "### 戊辰運（2–11歲／1995–2004年）",
    "【定性】平穩之運。",
    "【分析】分析文字。",
    "### 己巳運（12–21歲／2005–2014年）",
    "【定性】第二步定性。",
  ].join("\n");
  const chunks = splitDayunSteps(md, ["戊辰", "己巳", "庚午"]);
  assert.equal(chunks.length, 2);
  assert.equal(chunks[0].key, "戊辰");
  assert.equal(chunks[1].key, "己巳");
  assert.ok(chunks[0].body.includes("【定性】平穩之運。"));
});

test("splitDayunSteps:不在清單的干支不開塊", () => {
  const md = "### 辛未運（22–31歲）\n文字";
  assert.equal(splitDayunSteps(md, ["戊辰"]).length, 0);
});

test("splitYearBlocks:按年份切塊", () => {
  const md = "### 2023年（癸卯,30歲）\n【定性】事業承壓。\n### 2024年（甲辰,31歲）\n【定性】財上得力。";
  const chunks = splitYearBlocks(md, [2023, 2024, 2025]);
  assert.equal(chunks.length, 2);
  assert.equal(chunks[0].key, "2023");
  assert.ok(chunks[1].body.includes("財上得力"));
});
