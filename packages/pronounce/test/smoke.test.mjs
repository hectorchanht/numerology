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

import {
  resolveVoice,
  normalizeLangTag,
  useVoices,
  getLangLabel,
  getLangBadge,
  getLangColor,
  DEFAULT_LANGS,
  ZH_HK,
  ZH_CN,
} from "../dist/index.js";

test("exports new v0.4.0 symbols", () => {
  assert.equal(typeof useVoices, "function");
  assert.equal(typeof resolveVoice, "function");
  assert.equal(typeof getLangLabel, "function");
  assert.equal(typeof getLangBadge, "function");
  assert.equal(typeof getLangColor, "function");
  assert.deepEqual(DEFAULT_LANGS, ["zh-HK", "zh-CN"]);
  assert.equal(ZH_HK, "zh-HK");
  assert.equal(ZH_CN, "zh-CN");
});

const FAKE_VOICES = [
  { name: "Google 粵語（香港）", lang: "zh-HK", voiceURI: "uri-yue" },
  { name: "Google 國語（中國）", lang: "zh-CN", voiceURI: "uri-cmn" },
  { name: "Samantha", lang: "en-US", voiceURI: "uri-en" },
];

test("resolveVoice:指定 voice 名/URI 精確匹配", () => {
  assert.equal(resolveVoice(FAKE_VOICES, "zh-HK", "Samantha").name, "Samantha");
  assert.equal(resolveVoice(FAKE_VOICES, "en-US", "uri-yue").lang, "zh-HK");
});

test("resolveVoice:lang 精確匹配 → 基底匹配 → undefined", () => {
  assert.equal(resolveVoice(FAKE_VOICES, "zh-HK").name, "Google 粵語（香港）");
  // zh-TW 無精確匹配,退回同組國語 zh-CN(唔再退去粵語)
  assert.equal(resolveVoice(FAKE_VOICES, "zh-TW").lang, "zh-CN");
  assert.equal(resolveVoice(FAKE_VOICES, "ja-JP"), undefined);
  // 下劃線分隔亦正規化
  assert.equal(resolveVoice(FAKE_VOICES, "en_US").name, "Samantha");
});

test("resolveVoice:中文變體絕不跨組 fallback(國語唔可以用粵語 voice 讀)", () => {
  const yueOnly = [{ name: "Sin-ji", lang: "zh-HK", voiceURI: "uri-yue" }];
  // 無國語 voice:寧願 undefined(等瀏覽器按 utterance.lang 處理),唔好拎粵語 voice 讀國語
  assert.equal(resolveVoice(yueOnly, "zh-CN"), undefined);
  assert.equal(resolveVoice(yueOnly, "zh-TW"), undefined);
  assert.equal(resolveVoice(yueOnly, "zh-HK").name, "Sin-ji");
  // yue-HK 視同 zh-HK(新版 macOS 欣欣上報 yue-HK)
  const yueTag = [{ name: "Sin-ji", lang: "yue-HK", voiceURI: "uri-yue" }];
  assert.equal(resolveVoice(yueTag, "zh-HK").name, "Sin-ji");
  assert.equal(resolveVoice(yueTag, "zh-CN"), undefined);
});

test("normalizeLangTag:下劃線 → 連字號", () => {
  assert.equal(normalizeLangTag("zh_HK"), "zh-HK");
  assert.equal(normalizeLangTag("en-US"), "en-US");
});

test("getLangLabel:內建/自訂/退回標籤", () => {
  assert.equal(getLangLabel("zh-HK", "zht"), "廣東話");
  assert.equal(getLangLabel("ja-JP", "en"), "Japanese");
  assert.equal(
    getLangLabel("zh-HK", "zht", { "zh-HK": { zht: "白話" } }),
    "白話",
  );
  assert.equal(getLangLabel("xx-YY", "en"), "xx-YY");
});

test("getLangBadge:內建/自訂/基底大寫", () => {
  assert.equal(getLangBadge("zh-HK"), "粵");
  assert.equal(getLangBadge("en-US"), "EN");
  assert.equal(getLangBadge("en-US", { "en-US": "美" }), "美");
});

test("getLangColor:內建/自訂/退回預設藍", () => {
  assert.equal(getLangColor("zh-HK"), "#0071e3");
  assert.equal(getLangColor("ja-JP"), "#0071e3");
  assert.equal(getLangColor("ja-JP", { "ja-JP": "#ff0000" }), "#ff0000");
});
