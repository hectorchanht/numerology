import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isValidElement } from "react";
import {
  withQuoteRefs,
  QuoteRef,
} from "../test-dist/quoteRef.js";
import { withTermHighlights } from "../test-dist/highlightTerms.js";

/* ── 數據完整性:直接讀 lessons.ts 源碼做靜態檢查 ──────────────── */

const lessonsPath = fileURLToPath(
  new URL("../app/yijing/academy/lessons.ts", import.meta.url),
);
const src = fs.readFileSync(lessonsPath, "utf-8");
const blockStart = src.indexOf("export const ACADEMY_QUOTE_REFS");
assert.ok(blockStart > 0, "lessons.ts 須有 ACADEMY_QUOTE_REFS");
const blockEnd = src.indexOf("];", blockStart);
const block = src.slice(blockStart, blockEnd);
const ids = [...block.matchAll(/id: "([^"]+)"/g)].map((m) => m[1]);
const quotes = [...block.matchAll(/quote: "([^"]+)"/g)].map((m) => m[1]);
const urls = [...block.matchAll(/url: "([^"]+)"/g)].map((m) => m[1]);
// fullText 可能跨行(s 旗標)
const fullTexts = [...block.matchAll(/fullText:\s*"([\s\S]*?)"/g)].map((m) => m[1]);
const labels = [...block.matchAll(/sourceLabel: "([^"]+)"/g)].map((m) => m[1]);

test("引文條目:欄位齊全、id 唯一", () => {
  assert.ok(ids.length >= 1, "至少一條引文");
  assert.equal(new Set(ids).size, ids.length, "id 必須唯一");
  assert.equal(quotes.length, ids.length);
  assert.equal(urls.length, ids.length);
  assert.equal(fullTexts.length, ids.length);
  assert.equal(labels.length, ids.length);
  for (const q of quotes) assert.ok(q.length > 0, "quote 不得為空");
  for (const f of fullTexts) assert.ok(f.length > 0, "fullText 不得為空");
});

test("引文條目:URL 全部是已核實的 wikisource 鏈接(禁憑空編造)", () => {
  for (const u of urls) {
    assert.match(
      u,
      /^https:\/\/zh\.wikisource\.org\/wiki\/(周易|論語|尚書|荀子)\/[^"]+$/,
      `URL 必須是已核實的 wikisource 周易/論語/尚書/荀子頁: ${u}`,
    );
  }
});

test("引文條目:fullText 包含短引文(彈窗確實是原文的擴展,忽略標點差異)", () => {
  const strip = (s) => s.replace(/[，。、；：；「」『』…—·\s]/g, "");
  ids.forEach((id, i) => {
    assert.ok(
      strip(fullTexts[i]).includes(strip(quotes[i])),
      `${id}: fullText 須包含 quote「${quotes[i]}」(去標點後)`,
    );
  });
});

test("引文條目:每條短引文都以「」形式出現在課文正文裡(無孤兒條目)", () => {
  const missing = quotes.filter((q) => !src.includes(`「${q}」`));
  assert.deepEqual(missing, [], `以下引文在課文找不到: ${missing.join("、")}`);
});

test("課文引文標點:「」內不得有半形逗號(古典引文須用全形標點)", () => {
  const segs = [...src.matchAll(/「([^」]*)」/g)].map((m) => m[1]);
  const bad = segs.filter((s) => s.includes(","));
  assert.deepEqual(bad, [], `半形逗號殘留: ${bad.join(" | ")}`);
});

/* ── withQuoteRefs 切分邏輯 ──────────────────────────────────── */

const FIX = [
  {
    id: "a",
    quote: "元亨利貞",
    fullText: "元，亨，利，貞。",
    sourceLabel: "《周易·乾·卦辭》",
    url: "https://zh.wikisource.org/wiki/周易/乾",
  },
  {
    id: "b",
    quote: "潛龍勿用",
    fullText: "初九：潛龍勿用。",
    sourceLabel: "《周易·乾·初九》",
    url: "https://zh.wikisource.org/wiki/周易/乾",
  },
];

test("無命中時原樣返回原字串", () => {
  assert.equal(withQuoteRefs("今天天氣很好", FIX), "今天天氣很好");
  assert.equal(withQuoteRefs("", FIX), "");
});

test("命中引文被 <QuoteRef> 包裹,前後文字保留", () => {
  const out = withQuoteRefs("卦辭「元亨利貞」是大吉之象", FIX);
  assert.ok(Array.isArray(out), "應返回陣列");
  const els = out.filter((n) => isValidElement(n));
  assert.equal(els.length, 1);
  const el = els[0];
  assert.equal(el.type, QuoteRef);
  assert.equal(el.props.entry.id, "a");
  // 引號由組件渲染,原文不應殘留孤兒引號
  const texts = out.filter((n) => typeof n === "string").join("");
  assert.ok(!texts.includes("元亨利貞"), "引文不應殘留在純文字段");
});

test("一句多個引文全部包裹", () => {
  const out = withQuoteRefs("「潛龍勿用」後是「元亨利貞」", FIX);
  const els = out.filter((n) => isValidElement(n));
  assert.equal(els.length, 2);
  assert.deepEqual(
    els.map((e) => e.props.entry.id),
    ["b", "a"],
  );
});

test("QuoteRef 元素可被識別,供 withTermHighlights 整棵跳過", () => {
  const out = withQuoteRefs("看「潛龍勿用」", FIX);
  const el = out.find((n) => isValidElement(n));
  assert.ok(el, "應有 QuoteRef 元素");
  assert.equal(el.type, QuoteRef, "元素類型須為 QuoteRef");
  assert.equal(el.props.entry.id, "b");
});

test("withTermHighlights 不會鑽進 QuoteRef 改寫引文", () => {
  const rich = withQuoteRefs("日主為戊土，「潛龍勿用」待時", FIX);
  const highlighted = withTermHighlights(rich);
  // 走訪樹:QuoteRef 元素必須原樣保留(以類型識別)
  const found = [];
  const walk = (n) => {
    if (Array.isArray(n)) return n.forEach(walk);
    if (isValidElement(n)) {
      if (n.type === QuoteRef) found.push(n.props.entry.id);
      walk(n.props.children);
    }
  };
  walk(highlighted);
  assert.deepEqual(found, ["b"], "QuoteRef 須原樣保留,不被術語切分");
});

test("引文條目 id 在全文件唯一(無重複定義)", () => {
  const allIds = [...src.matchAll(/\bid: "([^"]+)"/g)].map((m) => m[1]);
  const dupes = allIds.filter((id, i) => allIds.indexOf(id) !== i);
  // lessons.ts 亦有課程 id(basics 等),只要求引文 id 互不重複且不與課程 id 撞
  const quoteDupes = dupes.filter((d) => ids.includes(d));
  assert.deepEqual(quoteDupes, [], `引文 id 重複: ${quoteDupes.join(",")}`);
});
