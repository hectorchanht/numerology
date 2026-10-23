import { test } from "node:test";
import assert from "node:assert/strict";
import { SECTION_ICONS, sectionIcon, withIconHeading } from "../test-dist/sectionIcons.js";

// 与 REPORT_SECTIONS / FORTUNE_SEGMENTS 的 key 保持一致(两份报告共 13 节)
const ALL_KEYS = [
  "personality", "career", "wealth", "relationship", "health", "luck", "advice",
  "overview", "dayun", "review", "future", "rhythm", "action",
];

test("13 个章节 key 都有非空图标", () => {
  for (const k of ALL_KEYS) {
    const icon = SECTION_ICONS[k];
    assert.ok(icon && icon.trim().length > 0, `${k} 缺少图标`);
  }
});

test("图标互不相同(不混淆)", () => {
  const icons = ALL_KEYS.map((k) => SECTION_ICONS[k]);
  assert.equal(new Set(icons).size, icons.length, "有重复图标");
});

test("未知 key 回落 ✦,永不抛错", () => {
  assert.equal(sectionIcon("nope"), "✦");
  assert.equal(sectionIcon(""), "✦");
});

test("withIconHeading 替换 AI 文本自带的 ## 标题行", () => {
  const md = "## 二、大运逐步精讲\n\n正文第一段。\n\n正文第二段。";
  const out = withIconHeading("dayun", "二、大運逐步精講", md);
  assert.ok(out.startsWith("## 🕰️ 二、大運逐步精講\n"), `标题行未正确替换: ${out.slice(0, 30)}`);
  assert.ok(out.includes("正文第一段。\n\n正文第二段。"), "正文应原样保留");
  assert.ok(!out.includes("二、大运逐步精讲"), "AI 的旧标题行不应残留");
});

test("withIconHeading 无标题行时补一个", () => {
  const out = withIconHeading("future", "四、未來流年走向", "正文。");
  assert.equal(out, "## 🔮 四、未來流年走向\n\n正文。");
});

test("图标与语言无关:同一 key 三地标题共用同一图标", () => {
  assert.equal(sectionIcon("dayun"), sectionIcon("dayun"), "同一 key 图标应稳定");
  // 繁/简/英标题不同,但 key 相同 → 图标相同(由调用方按 key 注入,不解析文本)
  const zh = withIconHeading("review", "三、回看校準", "x");
  const en = withIconHeading("review", "3. Review & Calibration", "x");
  assert.ok(zh.startsWith("## 🔍 ") && en.startsWith("## 🔍 "));
});
