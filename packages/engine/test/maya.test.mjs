import { test } from "node:test";
import assert from "node:assert/strict";
import { castMaya } from "../dist/index.js";

test("2012-12-21 = 13.0.0.0.0 = 4 Ajaw 3 K'ank'in", () => {
  const r = castMaya(2012, 12, 21);
  assert.equal(r.jdn, 2456283);
  assert.deepEqual(r.longCount, [13, 0, 0, 0, 0]);
  assert.deepEqual(r.tzolkin, { number: 4, dayIndex: 19, dayName: "Ajaw" });
  assert.deepEqual(r.haab, { day: 3, monthIndex: 13, monthName: "K'ank'in" });
  assert.equal(r.correlation, 584283);
});

// 第二錨點:帕卡爾王(K'inich Janaab' Pakal)生日,帕倫克銘文神廟。
// 出處(已抓取核對):https://en.wikipedia.org/wiki/Mesoamerican_Long_Count_calendar
// 「9.8.9.13.0 8 Ajaw 13 Pop … 24 March 603 CE Gregorian」,註明採 GMT 584283。
test("603-03-24 = 9.8.9.13.0 = 8 Ajaw 13 Pop", () => {
  const r = castMaya(603, 3, 24);
  assert.deepEqual(r.longCount, [9, 8, 9, 13, 0]);
  assert.deepEqual(r.tzolkin, { number: 8, dayIndex: 19, dayName: "Ajaw" });
  assert.deepEqual(r.haab, { day: 13, monthIndex: 0, monthName: "Pop" });
});

// 同頁資訊框:2026-11-04(UTC)= 13.0.14.1.6、13 Kimi 19 Sak(GMT)。
test("2026-11-04 = 13.0.14.1.6 = 13 Kimi 19 Sak", () => {
  const r = castMaya(2026, 11, 4);
  assert.deepEqual(r.longCount, [13, 0, 14, 1, 6]);
  assert.deepEqual(r.tzolkin, { number: 13, dayIndex: 5, dayName: "Kimi" });
  assert.deepEqual(r.haab, { day: 19, monthIndex: 10, monthName: "Sak" });
});

test("steps 含 584283 與 584285,無粵語字", () => {
  const r = castMaya(2012, 12, 21);
  assert.ok(r.steps.some((s) => s.includes("584283")));
  assert.ok(r.steps.some((s) => s.includes("584285")));
  assert.ok(!r.steps.some((s) => /[嘅咗喺唔嚟佢啲睇撳冇揀㗎]|而家/.test(s)));
});
