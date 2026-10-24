import { test } from "node:test";
import assert from "node:assert/strict";
import { sancaiOf, sancaiSize } from "../dist/index.js";

test("sancai: 125 格表完整", () => {
  assert.equal(sancaiSize(), 125);
});

test("sancai: 抽樣吉凶", () => {
  assert.equal(sancaiOf("木", "木", "木").luck, "吉");
  assert.equal(sancaiOf("金", "水", "金").luck, "吉");
  assert.equal(sancaiOf("水", "木", "木").luck, "吉");
  assert.equal(sancaiOf("火", "水", "木").luck, "半凶"); // 兩源衝突,按美名騰
  assert.equal(sancaiOf("土", "火", "金").luck, "半凶"); // 兩源衝突,按美名騰
  assert.equal(sancaiOf("水", "水", "水").luck, "凶");
  assert.equal(sancaiOf("金", "金", "金").luck, "凶");
  assert.equal(sancaiOf("土", "土", "土").luck, "吉");
  assert.equal(sancaiOf("木", "火", "土").luck, "吉");
  const r = sancaiOf("土", "金", "火");
  assert.equal(r.combo, "土金火");
  assert.equal(r.luck, "凶");
});
