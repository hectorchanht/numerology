import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ZIWEI_STARS as S, ZIWEI_STARS_META as M } from "../dist/index.js";

test("十四主星", () => {
  assert.equal(S.length, 14);
  assert.deepEqual(
    new Set(S.map((s) => s.name)),
    new Set(["紫微", "天机", "太阳", "武曲", "天同", "廉贞", "天府", "太阴", "贪狼", "巨门", "天相", "天梁", "七杀", "破军"]),
  );
  for (const s of S) {
    assert.ok(s.cite.length > 0, s.name);
    assert.ok(s.zhusi.length > 0, s.name);
    assert.ok(["北斗", "南斗", "中天"].includes(s.dou), s.name);
  }
});

test("meta 未校對、JSON 同內聯數據一致", () => {
  assert.equal(M.reviewed, false);
  const json = JSON.parse(readFileSync(new URL("../data/ziwei-stars.json", import.meta.url), "utf8"));
  assert.deepEqual(json.stars, S);
  assert.deepEqual(json.meta, M);
});
