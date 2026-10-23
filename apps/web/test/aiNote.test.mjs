import { test } from "node:test";
import assert from "node:assert/strict";
import { shortModelName, aiNoteText } from "../test-dist/aiNote.js";

const L = {
  siteFree: "本站免費 AI（有限額）",
  free: "免費",
  yourKey: "你的 key",
  noKey: "未填 key",
  defaultSuffix: "（預設）",
};

const base = { provider: "workers-ai", keys: {}, model: "", baseURL: "", systemPrompt: "" };

test("aiNote:shortModelName 縮短顯示", () => {
  assert.equal(shortModelName("@cf/mistralai/mistral-small-3.1-24b-instruct"), "mistral-small-3.1-24b");
  assert.equal(shortModelName("@cf/meta/llama-3.3-70b-instruct-fp8-fast"), "llama-3.3-70b");
  assert.equal(shortModelName("@cf/aisingapore/gemma-sea-lion-v4-27b-it"), "gemma-sea-lion-v4-27b-it");
  assert.equal(shortModelName("gpt-4o-mini"), "gpt-4o-mini");
  assert.equal(shortModelName("gemini-2.0-flash"), "gemini-2.0-flash");
});

test("aiNote:預設 workers-ai → 本站免費 AI（有限額）,唔提 $2/Cloudflare", () => {
  const text = aiNoteText(base, L, "Workers AI");
  assert.equal(text, "Workers AI（預設） · 本站免費 AI（有限額）");
  assert.ok(!text.includes("$2") && !text.toLowerCase().includes("cloudflare"));
});

test("aiNote:自選 model 顯示縮短名", () => {
  const text = aiNoteText(
    { ...base, model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast" }, L, "Workers AI",
  );
  assert.equal(text, "llama-3.3-70b · 本站免費 AI（有限額）");
});

test("aiNote:有 key → 你的 key", () => {
  const s = { provider: "openrouter", keys: { openrouter: "sk-xxx" }, model: "deepseek/deepseek-chat-v3-0324:free", baseURL: "", systemPrompt: "" };
  assert.equal(aiNoteText(s, L, "OpenRouter"), "deepseek-chat-v3-0324:free · 你的 key");
});

test("aiNote:要 key 但未填 → 未填 key", () => {
  const s = { ...base, provider: "gemini", model: "gemini-2.0-flash" };
  assert.equal(aiNoteText(s, L, "Gemini"), "gemini-2.0-flash · 未填 key");
});

test("aiNote:pollinations 免 key → 免費", () => {
  const s = { ...base, provider: "pollinations" };
  assert.equal(aiNoteText(s, L, "Pollinations"), "Pollinations（預設） · 免費");
});
