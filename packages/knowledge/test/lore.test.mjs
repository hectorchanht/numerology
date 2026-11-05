import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { AGRIPPA_SCALES, GEMATRIA_TERMS, HEBREW_LETTERS, BEHENIAN, LULU, SEFER_YETZIRAH } from "../dist/index.js";
import LORE from "../dist/lore.data.js";

const load = (f) => JSON.parse(readFileSync(new URL(`../data/${f}.json`, import.meta.url), "utf8"));

test("內聯資料與 JSON 一致", () => {
  assert.deepEqual(LORE.behenian, load("behenian-stars"));
  assert.deepEqual(LORE.lulu, load("lulu"));
  assert.deepEqual(LORE.gematria.terms, load("greek-gematria").terms);
  assert.deepEqual(AGRIPPA_SCALES.map((s) => s.n), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12]);
});

test("出口形狀", () => {
  assert.equal(HEBREW_LETTERS.length, 22);
  assert.equal(BEHENIAN.stars.length, 15);
  assert.equal(BEHENIAN.orb.degrees, 6);
  assert.equal(LULU.huainanzi.pipes.length, 12);
  assert.equal(SEFER_YETZIRAH.simples.supplement.items.length, 12);
  assert.ok(GEMATRIA_TERMS.every((t) => Number.isInteger(t.value)));
});
