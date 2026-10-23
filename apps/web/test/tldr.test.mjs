import { test } from "node:test";
import assert from "node:assert/strict";
import { splitTldr } from "../test-dist/tldr.js";

test("splitTldr:標準一行 TL;DR + 正文", () => {
  assert.deepEqual(splitTldr("TL;DR:事業今年宜守不宜攻。\n\n正文第一段。\n\n第二段。"), {
    tldr: "事業今年宜守不宜攻。",
    body: "正文第一段。\n\n第二段。",
  });
});

test("splitTldr:容錯加粗/引用/全形冒號/英文", () => {
  assert.equal(splitTldr("**TL;DR**：宜守。\n\n正文").tldr, "宜守。");
  assert.equal(splitTldr("> TL;DR: Hold, don't push.\n\nBody").tldr, "Hold, don't push.");
  assert.equal(splitTldr("**TL;DR：宜守。**\n\n正文").tldr, "宜守。");
  assert.equal(splitTldr("\n\nTLDR: ok\nbody").body, "body");
});

test("splitTldr:冇標記(舊記錄/舊緩存)→ null,正文原樣", () => {
  assert.deepEqual(splitTldr("正文。\n\n第二段"), { tldr: null, body: "正文。\n\n第二段" });
  assert.deepEqual(splitTldr("The day master is strong."), { tldr: null, body: "The day master is strong." });
});

test("splitTldr:串流中途(標記未完/摘要未完)", () => {
  assert.deepEqual(splitTldr("TL"), { tldr: "", body: "" });
  assert.deepEqual(splitTldr("**TL;"), { tldr: "", body: "" });
  assert.deepEqual(splitTldr("TL;DR:事業今年"), { tldr: "事業今年", body: "" });
});
