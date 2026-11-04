import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { taixuanHead, TAIXUAN_META, TZOLKIN_DAY_NAMES, HAAB_MONTHS, MAYA_META } from "../dist/index.js";
import TX from "../dist/taixuan.data.js";
import MY from "../dist/maya.data.js";

const load = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), "utf8"));

test("太玄 81 首齊全,首 1 中、首 81 養,每首有 cite", () => {
  for (let n = 1; n <= 81; n++) {
    const h = taixuanHead(n);
    assert.equal(h.n, n);
    assert.ok(h.name && h.cite.work && h.cite.locator.includes("https://"), String(n));
  }
  assert.equal(taixuanHead(1).name, "中");
  assert.equal(taixuanHead(81).name, "養");
  assert.throws(() => taixuanHead(0));
  assert.throws(() => taixuanHead(82));
  assert.equal(TAIXUAN_META.tier, "classical");
});

test("瑪雅 20 日名與 19 月名", () => {
  assert.equal(TZOLKIN_DAY_NAMES.length, 20);
  assert.equal(TZOLKIN_DAY_NAMES[0].name, "Imix");
  assert.equal(TZOLKIN_DAY_NAMES[0].n, 0);
  assert.equal(TZOLKIN_DAY_NAMES[19].name, "Ajaw");
  assert.ok(TZOLKIN_DAY_NAMES[19].aliases.includes("Ahau"));
  assert.equal(HAAB_MONTHS.length, 19);
  assert.equal(HAAB_MONTHS[13].name, "K'ank'in");
  assert.ok(HAAB_MONTHS[13].aliases.includes("Kankin"));
  assert.equal(HAAB_MONTHS[18].name, "Wayeb");
  assert.equal(MAYA_META.tier, "scholarly");
});

test("內聯模組與 JSON 全量 deepEqual", () => {
  assert.deepEqual(TX, load("taixuan.json"));
  assert.deepEqual(MY, load("maya.json"));
});
