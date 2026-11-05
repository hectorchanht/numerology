import { test } from "node:test";
import assert from "node:assert/strict";
import { GANZHI_RELATIONS as R, GANZHI_RELATIONS_META as M } from "../dist/index.js";

test("組數", () => {
  assert.equal(R.zhiLiuHe.length, 6);
  assert.equal(R.zhiSanHe.length, 4);
  assert.equal(R.zhiSanHui.length, 4);
  assert.equal(R.zhiChong.length, 6);
  assert.equal(R.zhiHai.length, 6);
  assert.equal(R.zhiPo.length, 6);
});

test("每個地支在六沖中恰好一次", () => {
  const all = R.zhiChong.flat();
  assert.equal(new Set(all).size, 12);
  assert.equal(all.length, 12);
});

test("三合中神依次為 子 卯 午 酉", () => {
  assert.deepEqual(R.zhiSanHe.map((x) => x.members[1]), ["子", "卯", "午", "酉"]);
});

test("cite 九項非空、meta 未校對", () => {
  const keys = ["ganHe", "ganChong", "zhiLiuHe", "zhiSanHe", "zhiSanHui", "zhiChong", "zhiHai", "zhiXing", "zhiPo"];
  for (const k of keys) assert.ok(R.cite[k]?.length > 0, k);
  assert.equal(M.reviewed, false);
  assert.equal(M.tier, "classical");
});
