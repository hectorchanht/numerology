import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseVerdictAnalysis,
  parseEvidenceBlock,
  parseRhythmItems,
  splitDayunSteps,
  splitYearBlocks,
  parseSectionBlocks,
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

test("parseEvidenceBlock:繁體【依據】都切得出", () => {
  const r = parseEvidenceBlock("正文。\n\n【依據】\n- 八字日主辛金\n- 紫微命宮巨門");
  assert.equal(r.body, "正文。");
  assert.deepEqual(r.evidence, ["八字日主辛金", "紫微命宮巨門"]);
});

test("parseEvidenceBlock:證據後接下一個定性唔好吞", () => {
  const r = parseEvidenceBlock("正文。【依據】\n- 甲證據\n【定性】下一段定性。");
  assert.deepEqual(r.evidence, ["甲證據"]);
});

/* ── parseSectionBlocks:fixture 全部摘自 2026-11-02 真實模型輸出(性格特質節) ── */

test("parseSectionBlocks:qwen3-30b 形——定性/分析同段相連,逐組切開", () => {
  const md = [
    "【定性】八字傷官透月干，性格像開了閘的水——話多點子密，但火旺金熔，急躁時連自己都控制不住。",
    "【分析】日主辛金坐亥水傷官，月柱壬午傷官透干，時柱癸巳食神生財，傷官強旺代表思維敏捷、表達欲爆棚。",
    "",
    "【定性】紫微命宮太陽太陰合宮，表面熱情似太陽，內裡藏鋒如太陰，外熱內冷是本能。",
    "【分析】命宮丑宮太陽（不祿）太陰（科）同坐，太陽主光熱卻無力，太陰主陰柔卻帶清貴。",
  ].join("\n");
  const nodes = parseSectionBlocks(md);
  assert.equal(nodes.length, 2);
  assert.equal(nodes[0].kind, "va");
  assert.ok(nodes[0].verdict.includes("開了閘的水"));
  assert.ok(nodes[0].analysis.includes("日主辛金坐亥水傷官"));
  assert.deepEqual(nodes[0].evidence, []);
  assert.ok(nodes[1].verdict.includes("外熱內冷是本能"));
});

test("parseSectionBlocks:qwen3-8b 形——定性+依據列表,尾隨字數行歸正文", () => {
  const md = [
    "【定性】這人天生帶「金水」體質，像淬火的刀刃，外冷內熱，習慣用理性克制情緒。",
    "【依據】",
    "- 八字日主辛金坐亥水，金水相生的體質讓情緒像流水般流動；",
    "- 紫微命宮丑土為「天機」化權，思維模式偏向拆解問題；",
    "",
    "（全文共約1050字）",
  ].join("\n");
  const nodes = parseSectionBlocks(md);
  assert.equal(nodes.length, 2);
  assert.equal(nodes[0].kind, "va");
  assert.equal(nodes[0].evidence.length, 2);
  assert.ok(nodes[0].evidence[0].startsWith("八字日主辛金坐亥水"));
  assert.equal(nodes[1].kind, "plain");
  assert.ok(nodes[1].md.includes("全文共約1050字"));
});

test("parseSectionBlocks:gpt-oss 形——全節冇定性標記,一段文字+一嚿依據重複", () => {
  const md = [
    "你天生具備領導潛質，但缺少直接的權威顯現，需要外在機會才能發揮。",
    "【依據】",
    "- 命宮主星太陽不入命宮",
    "- 太陰在命宮",
    "",
    "口才出眾、思維靈活，但易因利益驅動而顯得衝動或自信過度。",
    "【依據】",
    "- 日主辛金",
  ].join("\n");
  const nodes = parseSectionBlocks(md);
  assert.equal(nodes.length, 2);
  assert.equal(nodes[0].kind, "plain");
  assert.ok(nodes[0].md.startsWith("你天生具備領導潛質"));
  assert.deepEqual(nodes[0].evidence, ["命宮主星太陽不入命宮", "太陰在命宮"]);
  assert.ok(nodes[1].md.startsWith("口才出眾"));
  assert.deepEqual(nodes[1].evidence, ["日主辛金"]);
});

test("parseSectionBlocks:deepseek 形——小標題+定性分析依據,證據後仲有金句段", () => {
  const md = [
    "### 行為模式：果斷與耐心的平衡",
    "【定性】這人的行為模式是「果斷中帶有耐心」，行事果斷，但也能耐得住性子等待機會。",
    "【分析】八字日主辛金，代表堅強與果斷；紫微命宮的巨門（穩重）與火星（行動力），讓他行事果斷。",
    "",
    "【依據】",
    "- 八字日主辛金，藏干中有壬甲，代表理性與策略。",
    "- 紫微命宮巨門，象徵穩重、負責。",
    "",
    "### 金句",
    "「性格如水，既能柔韌也能堅韌，進退自如。」",
  ].join("\n");
  const nodes = parseSectionBlocks(md);
  assert.equal(nodes.length, 3);
  assert.equal(nodes[0].kind, "plain");
  assert.ok(nodes[0].md.includes("行為模式"));
  assert.equal(nodes[1].kind, "va");
  assert.equal(nodes[1].evidence.length, 2);
  assert.equal(nodes[2].kind, "plain");
  assert.ok(nodes[2].md.includes("性格如水"));
});

test("parseSectionBlocks:截圖形——分析 inline 黐段中、依據後即刻接下一個定性", () => {
  const md =
    "【定性】你表面像座山（戊土日主坐午火帝旺），內心卻像水一樣流動（天機太陰），既扛得住事又愛琢磨細節。【分析】戊土日主生於卯月（木旺土虛），月柱丁卯正印貼身化殺，天生有扛壓力的底子。【依據】\n" +
    "- 八字日主戊土坐午火帝旺，月柱丁卯正印\n" +
    "- 紫微命宮天機得、太陰利，火星陷\n" +
    "【定性】你做事像「算盤打得噼啪響」（七殺正印在八字），但天機主變。";
  const nodes = parseSectionBlocks(md);
  assert.equal(nodes.length, 2);
  assert.ok(nodes[0].verdict.includes("戊土日主坐午火帝旺"));
  assert.ok(nodes[0].analysis.includes("月柱丁卯正印貼身化殺"));
  assert.equal(nodes[0].evidence.length, 2);
  assert.ok(nodes[1].verdict.includes("算盤打得噼啪響"));
});

test("parseSectionBlocks:冇標記舊文本 → 一個 plain 塊原樣唔改", () => {
  const md = "這是一段沒有任何標記的舊文本。講命盤整體格局。\n\n第二段，繼續講落去，冇定性冇分析冇依據。";
  const nodes = parseSectionBlocks(md);
  assert.deepEqual(nodes, [{ kind: "plain", md, evidence: [] }]);
});

test("parseSectionBlocks:簡體【依据】一樣切得出", () => {
  const nodes = parseSectionBlocks("【定性】先抑後揚。\n【分析】前段承壓。\n【依据】\n- 天干比肩\n- 化忌入夫妻");
  assert.equal(nodes.length, 1);
  assert.deepEqual(nodes[0].evidence, ["天干比肩", "化忌入夫妻"]);
});

test("parseSectionBlocks:gemma 形——長文一段過,最尾先一嚿依據", () => {
  const md = [
    "他的人生信條是：穩定是底線，理想是動力。他渴望在事業上有所成就，但更注重家庭的幸福。",
    "",
    "【依據】",
    "- 八字：庚金坐申",
    "- 紫微：命宮巨門星",
  ].join("\n");
  const nodes = parseSectionBlocks(md);
  assert.equal(nodes.length, 1);
  assert.equal(nodes[0].kind, "plain");
  assert.ok(nodes[0].md.includes("穩定是底線"));
  assert.deepEqual(nodes[0].evidence, ["八字：庚金坐申", "紫微：命宮巨門星"]);
});

test("parseSectionBlocks:空字串 → 空陣列", () => {
  assert.deepEqual(parseSectionBlocks(""), []);
  assert.deepEqual(parseSectionBlocks("  \n\n "), []);
});
