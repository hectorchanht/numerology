import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  LIUREN_META,
  LIUREN_YUEJIANG,
  LIUREN_SHEN_NAME,
  LIUREN_JIGONG,
  LIUREN_GUIREN,
  LIUREN_JIANG,
  LIUREN_METHODS,
  LIUREN_CITE,
  DIZHI,
  TIANGAN,
} from "../dist/index.js";

const json = JSON.parse(readFileSync(new URL("../data/liuren.json", import.meta.url), "utf8"));

test("月將:12 中氣,12 個支各出現一次;神名 12 支齊", () => {
  const vals = Object.values(LIUREN_YUEJIANG);
  assert.equal(vals.length, 12);
  assert.deepEqual([...vals].sort(), [...DIZHI].sort());
  assert.deepEqual(Object.keys(LIUREN_SHEN_NAME).sort(), [...DIZHI].sort());
  assert.equal(LIUREN_YUEJIANG["雨水"], "亥");
  assert.equal(LIUREN_YUEJIANG["小雪"], "寅");
});

test("寄宮:10 干齊,值只得 8 個支", () => {
  assert.deepEqual(Object.keys(LIUREN_JIGONG).sort(), [...TIANGAN].sort());
  assert.equal(new Set(Object.values(LIUREN_JIGONG)).size, 8);
});

test("貴人:10 干齊,每干晝夜唔同;壬同癸(卷09)", () => {
  assert.deepEqual(Object.keys(LIUREN_GUIREN).sort(), [...TIANGAN].sort());
  for (const [g, v] of Object.entries(LIUREN_GUIREN)) {
    assert.ok(DIZHI.includes(v.day) && DIZHI.includes(v.night), g);
    assert.notEqual(v.day, v.night, g);
  }
  assert.deepEqual(LIUREN_GUIREN["壬"], { day: "巳", night: "卯" });
});

test("十二天將唔重複,首個係貴人", () => {
  assert.equal(LIUREN_JIANG.length, 12);
  assert.equal(new Set(LIUREN_JIANG).size, 12);
  assert.equal(LIUREN_JIANG[0], "貴人");
});

test("九宗門 9 個,id 唯一,cite 非空", () => {
  assert.equal(LIUREN_METHODS.length, 9);
  assert.equal(new Set(LIUREN_METHODS.map((m) => m.id)).size, 9);
  for (const m of LIUREN_METHODS) assert.ok(m.cite.includes("卷"), m.id);
  assert.ok(LIUREN_CITE.work.includes("六壬大全"));
});

test("書例 ≥ 8 條,有卷次;期望三傳同書載三傳一致", () => {
  const ids = new Set(LIUREN_METHODS.map((m) => m.id));
  assert.ok(json.examples.length >= 8);
  for (const e of json.examples) {
    assert.match(e.juan, /^卷\d\d$/, e.id);
    assert.ok(ids.has(e.expected.method), e.id);
    const sc = [e.expected.chu, e.expected.zhong, e.expected.mo];
    if (e.bookSanChuan) assert.deepEqual(sc, e.bookSanChuan, e.id);
  }
  const shehai = json.examples.find((e) => e.day === "丁卯" && e.hour === "丑" && e.jiang === "亥");
  assert.equal(shehai.expected.chu, "亥");
});

test("meta 未校對、classical;JSON 同內聯 data.ts 一致", async () => {
  assert.equal(LIUREN_META.reviewed, false);
  assert.equal(LIUREN_META.tier, "classical");
  const { default: inline } = await import("../dist/liuren.data.js");
  assert.deepEqual(inline, json);
});

test("神煞表:每項有卷次引文、鍵齊全、值俱為地支;rejected 有理由", async () => {
  const { LIUREN_SHENSHA } = await import("../dist/index.js");
  const keys = { 日干: TIANGAN, 日支: DIZHI, 旬: ["甲子", "甲戌", "甲申", "甲午", "甲辰", "甲寅"] };
  assert.equal(LIUREN_SHENSHA.length, json.shensha.items.length);
  for (const s of LIUREN_SHENSHA) {
    assert.match(s.cite, /^卷\d\d「.{1,20}」/, s.name);
    assert.deepEqual(Object.keys(s.values).sort(), [...keys[s.by]].sort(), s.name);
    for (const v of Object.values(s.values)) assert.ok(DIZHI.includes(v), `${s.name} ${v}`);
  }
  for (const r of json.shensha.rejected) assert.ok(r.name && r.reason, r.name);
});
