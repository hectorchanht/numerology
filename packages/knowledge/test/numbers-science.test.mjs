import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { numberQuality, SCIENCE_NOTES } from "../dist/index.js";
import NUMBERS_DATA from "../dist/pythagorean-numbers.data.js";
import SCIENCE_DATA from "../dist/science-notes.data.js";

const load = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), "utf8"));
const LANGS = ["zht", "zhs", "en"];

test("1–9 與 11/22/33 皆有條目且三語非空、每條有 cite.work", () => {
  for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33]) {
    const q = numberQuality(n);
    assert.ok(q, `missing ${n}`);
    for (const l of LANGS) assert.ok(q.keywords[l]?.trim(), `${n} ${l}`);
    assert.ok(q.cite.work, `${n} cite`);
  }
  assert.equal(numberQuality(10), undefined);
});

test("1–9 classical 引 Theology of Arithmetic;11/22/33 modern", () => {
  for (let n = 1; n <= 9; n++) {
    const q = numberQuality(n);
    assert.equal(q.tier, "classical");
    assert.ok(q.cite.work.includes("Theology of Arithmetic"));
  }
  for (const n of [11, 22, 33]) assert.equal(numberQuality(n).tier, "modern");
});

test("科學條目恰為四條,cite 含頁碼,reviewed:false", () => {
  assert.deepEqual(SCIENCE_NOTES.map((s) => s.id), ["forer-1949", "carlson-1985", "dean-kelly-2003", "look-elsewhere"]);
  const pages = ["118", "318", "175", "853"];
  SCIENCE_NOTES.forEach((s, i) => {
    assert.ok(JSON.stringify(s.cite).includes(pages[i]), s.id);
    assert.equal(s.reviewed, false);
    for (const l of LANGS) assert.ok(s.claim[l]?.trim(), `${s.id} ${l}`);
  });
});

test("zht 不含粵語字", () => {
  const all = JSON.stringify([NUMBERS_DATA, SCIENCE_DATA]);
  assert.doesNotMatch(all, /[嘅咗喺唔嚟佢啲]/);
});

test(".data.ts 與 JSON deepEqual", () => {
  assert.deepEqual(NUMBERS_DATA, load("pythagorean-numbers.json"));
  assert.deepEqual(SCIENCE_DATA, load("science-notes.json"));
});
