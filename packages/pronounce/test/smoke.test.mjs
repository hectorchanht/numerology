import { test } from "node:test";
import assert from "node:assert/strict";
import {
  useSpeech,
  splitSpeechSentences,
  PronounceButton,
  speechText,
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

test("speechText:strip markdown 保留文字", () => {
  assert.equal(speechText("## 標題\n**粗體**同*斜體*"), "標題\n粗體同斜體");
  assert.equal(speechText("[連結](https://x.com)同`code`"), "連結同code");
  assert.equal(speechText("```js\nconst a = 1;\n```\n留低呢句"), "留低呢句");
  assert.equal(speechText("- 第一項\n- 第二項"), "第一項\n第二項");
  assert.equal(speechText("> 引用\n普通"), "引用\n普通");
});

test("speechText:空/純文字 pass-through", () => {
  assert.equal(speechText("   "), "");
  assert.equal(speechText("你好世界"), "你好世界");
});
