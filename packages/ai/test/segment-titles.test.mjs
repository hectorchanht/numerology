import { test } from "node:test";
import assert from "node:assert/strict";
import {
  REPORT_SEGMENTS,
  FORTUNE_SEGMENTS,
  SEGMENT_TITLES,
  segmentTitle,
  buildReportSectionPrompt,
  buildFortuneSectionPrompt,
  buildReportUserPrompt,
  buildFortuneReportPrompt,
} from "../dist/index.js";

const ALL = [...REPORT_SEGMENTS, ...FORTUNE_SEGMENTS];

test("每个分节 key 都有三地标题(非空)", () => {
  for (const seg of ALL) {
    const t = SEGMENT_TITLES[seg.key];
    assert.ok(t, `缺少标题对照: ${seg.key}`);
    for (const loc of ["zht", "zhs", "en"]) {
      assert.ok(t[loc] && t[loc].trim().length > 0, `${seg.key} 缺少 ${loc} 标题`);
    }
  }
});

test("segmentTitle 按 locale 取标题,缺失回落", () => {
  assert.equal(segmentTitle("personality", "zht"), "性格特質");
  assert.equal(segmentTitle("personality", "zhs"), "性格特质");
  assert.equal(segmentTitle("personality", "en"), "Personality Traits");
  assert.equal(segmentTitle("overview", "zht"), "一、當前總覽");
  assert.equal(segmentTitle("nope", "zht"), "nope");
});

test("buildReportSectionPrompt 小标题随 locale 变化", () => {
  const seg = REPORT_SEGMENTS.find((s) => s.key === "personality");
  const zht = buildReportSectionPrompt([], seg, "both", "zht");
  assert.ok(zht.includes("## 性格特質"), "zht 应为繁体标题");
  assert.ok(!zht.includes("性格特质"), "zht 不应出现简体标题");
  const zhs = buildReportSectionPrompt([], seg, "both", "zhs");
  assert.ok(zhs.includes("## 性格特质"), "zhs 应为简体标题");
  const en = buildReportSectionPrompt([], seg, "both", "en");
  assert.ok(en.includes("## Personality Traits"), "en 应为英文标题");
  // 默认 = zht
  const def = buildReportSectionPrompt([], seg);
  assert.ok(def.includes("## 性格特質"), "默认 locale 应为 zht");
});

test("buildFortuneSectionPrompt 小标题随 locale 变化", () => {
  const seg = FORTUNE_SEGMENTS.find((s) => s.key === "overview");
  const zht = buildFortuneSectionPrompt([], seg, "both", "zht");
  assert.ok(zht.includes("## 一、當前總覽"), "zht 应为繁体标题");
  const en = buildFortuneSectionPrompt([], seg, "both", "en");
  assert.ok(en.includes("## 1. Current Overview"), "en 应为英文标题");
  assert.ok(!en.includes("一、当前总览"), "en 不应出现简体标题");
});

test("整篇报告指令的章节标题随 locale 变化", () => {
  const zht = buildReportUserPrompt([], "zht");
  assert.ok(zht.includes("性格特質") && zht.includes("總體建議 · 開運參考"));
  assert.ok(!zht.includes("性格特质"));
  const en = buildReportUserPrompt([], "en");
  assert.ok(en.includes("Personality Traits"));
  const fzht = buildFortuneReportPrompt([], "zht");
  assert.ok(fzht.includes("## 一、當前總覽") && fzht.includes("## 六、行動建議"));
  assert.ok(!fzht.includes("## 一、当前总览"));
  const fen = buildFortuneReportPrompt([], "en");
  assert.ok(fen.includes("## 1. Current Overview") && fen.includes("## 6. Actionable Advice"));
});
