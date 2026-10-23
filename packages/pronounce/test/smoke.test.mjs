import { test } from "node:test";
import assert from "node:assert/strict";
import {
  useSpeech,
  splitSpeechSentences,
  PronounceButton,
} from "../dist/index.js";

test("exports useSpeech hook", () => {
  assert.equal(typeof useSpeech, "function");
});

test("exports PronounceButton component", () => {
  assert.equal(typeof PronounceButton, "function");
});

test("splitSpeechSentences:按中英句讀切分(超 maxLen 才另起)", () => {
  assert.deepEqual(
    splitSpeechSentences("你好世界這是第一句。再見世界這是第二句。", 12),
    ["你好世界這是第一句。", "再見世界這是第二句。"],
  );
  assert.deepEqual(splitSpeechSentences("短。句。", 120), ["短。 句。"]);
});

test("splitSpeechSentences:空字串 → []", () => {
  assert.deepEqual(splitSpeechSentences("   "), []);
});

test("splitSpeechSentences:過短合併(不超過 maxLen 不另起)", () => {
  const parts = splitSpeechSentences("甲。乙。丙。", 10);
  assert.ok(parts.length <= 2, `實得 ${parts.length}: ${JSON.stringify(parts)}`);
  assert.equal(parts.join("").replace(/ /g, ""), "甲。乙。丙。");
});

test("splitSpeechSentences:超長無標點硬切", () => {
  const s = "a".repeat(300);
  const parts = splitSpeechSentences(s, 120);
  assert.ok(parts.length >= 2, `應切成多段,實得 ${parts.length}`);
  assert.equal(parts.join("").replace(/ /g, ""), s);
});

test("splitSpeechSentences:換行亦切分", () => {
  assert.deepEqual(splitSpeechSentences("第一行\n第二行"), ["第一行", "第二行"]);
});
