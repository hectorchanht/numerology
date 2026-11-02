import { test } from "node:test";
import assert from "node:assert/strict";
import { splitThinking, joinThinking } from "../test-dist/thinking.js";

test("splitThinking:冇標籤 → 零影響,原文照返", () => {
  const s = splitThinking("## 性格特質\nTL;DR:宜守。\n\n正文。");
  assert.equal(s.thinking, "");
  assert.equal(s.content, "## 性格特質\nTL;DR:宜守。\n\n正文。");
  assert.equal(s.open, false);
});

test("splitThinking:標準一段思考 + 正文", () => {
  const s = splitThinking("<think>先諗諗點切入。</think>\n\n## 性格特質\n正文。");
  assert.equal(s.thinking, "先諗諗點切入。");
  assert.equal(s.content, "## 性格特質\n正文。");
  assert.equal(s.open, false);
});

test("splitThinking:流式未閉合 → 全部歸 thinking,content 空,open=true", () => {
  const s = splitThinking("<think>諗到一半,未寫完");
  assert.equal(s.thinking, "諗到一半,未寫完");
  assert.equal(s.content, "");
  assert.equal(s.open, true);
  // 啱啱開標籤、思考仲係空
  const s2 = splitThinking("<think>");
  assert.equal(s2.content, "");
  assert.equal(s2.open, true);
});

test("splitThinking:多段 + 文中段全部抽走,次序保留", () => {
  const s = splitThinking("前文<think>一</think>中段<think>二</think>後文");
  assert.equal(s.thinking, "一\n\n二");
  assert.equal(s.content, "前文中段後文");
  assert.equal(s.open, false);
});

test("splitThinking:正文入面嘅普通尖括號唔受影響", () => {
  const s = splitThinking("比較 a < b 同 c > d,仲有 <b> 標籤。");
  assert.equal(s.thinking, "");
  assert.equal(s.content, "比較 a < b 同 c > d,仲有 <b> 標籤。");
});

test("joinThinking:round-trip 同 splitThinking 對得返", () => {
  const joined = joinThinking("諗咗一輪", "## 性格特質\n正文");
  const s = splitThinking(joined);
  assert.equal(s.thinking, "諗咗一輪");
  assert.equal(s.content, "## 性格特質\n正文");
  // 冇思考 → 原樣(舊記錄兼容)
  assert.equal(joinThinking(undefined, "正文"), "正文");
  assert.equal(joinThinking("", "正文"), "正文");
  assert.equal(joinThinking("  ", "正文"), "正文");
});
