import { test } from "node:test";
import assert from "node:assert/strict";
import { summarizeYijingCast } from "../test-dist/yijingHistory.js";

test("yijingHistory:summarize coin —— 六爻全少陽 = 乾#1,無變卦", () => {
  const s = summarizeYijingCast({
    id: "x", kind: "coin", at: 1, lines: [7, 7, 7, 7, 7, 7],
  });
  assert.equal(s.hexagram, 1);
  assert.equal(s.changed, null);
  assert.deepEqual(s.moving, []);
});

test("yijingHistory:summarize coin —— 有動爻還原變卦", () => {
  // 初九動:乾#1 → 姤#44
  const s = summarizeYijingCast({
    id: "x", kind: "coin", at: 1, lines: [9, 7, 7, 7, 7, 7],
  });
  assert.equal(s.hexagram, 1);
  assert.equal(s.changed, 44);
  assert.deepEqual(s.moving, [1]);
});

test("yijingHistory:summarize meihua —— 2025-01-01 12:00 = 睽#38 動2 變噬嗑#21", () => {
  const s = summarizeYijingCast({
    id: "x", kind: "meihua", at: 1, datetime: "2025-01-01T12:00",
  });
  assert.equal(s.hexagram, 38);
  assert.equal(s.changed, 21);
  assert.deepEqual(s.moving, [2]);
  assert.ok(s.verdict); // 體用斷級別
});

test("yijingHistory:summarize liuyao —— 爻值還原卦象", () => {
  const s = summarizeYijingCast({
    id: "x", kind: "liuyao", at: 1, date: "2026-10-23", lines: [8, 8, 8, 8, 8, 8],
  });
  assert.equal(s.hexagram, 2); // 坤
  assert.equal(s.changed, null);
});

test("yijingHistory:summarize —— 壞數據回 null,唔爆", () => {
  assert.equal(summarizeYijingCast({ id: "x", kind: "coin", at: 1, lines: [7, 7] }), null);
  assert.equal(summarizeYijingCast({ id: "x", kind: "meihua", at: 1, datetime: "bad" }), null);
  assert.equal(summarizeYijingCast({ id: "x", kind: "weird", at: 1 }), null);
});
