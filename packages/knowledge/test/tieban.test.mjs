import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { TIEBAN, TIEBAN_META, MINGLI_GLOSSARY } from "../dist/index.js";

test("四個 topic 皆有條目、id 唯一、cite 非空", () => {
  for (const t of ["origin", "siku", "procedure", "relation"]) {
    assert.ok(TIEBAN.some((e) => e.topic === t), t);
  }
  assert.equal(new Set(TIEBAN.map((e) => e.id)).size, TIEBAN.length);
  for (const e of TIEBAN) {
    assert.ok(e.cite.trim().length > 0, e.id);
    assert.ok(e.zht.trim().length > 0, e.id);
    if (e.quote) assert.ok([...e.quote].length <= 30, `${e.id} quote 過長`);
  }
});

test("procedure 條全部 tier modern、註明各派不一、不含示例條文號", () => {
  const ps = TIEBAN.filter((e) => e.topic === "procedure");
  assert.ok(ps.length > 0);
  for (const e of ps) {
    assert.equal(e.tier, "modern", e.id);
    assert.ok(e.zht.includes("各派不一"), e.id);
    const nums = (e.zht.match(/\d{4,5}/g) ?? []);
    assert.deepEqual(nums, [], `${e.id} 含疑似條文號`);
  }
});

test("meta 未校對、scholarly;JSON 同內聯 data.ts 一致", async () => {
  assert.equal(TIEBAN_META.reviewed, false);
  assert.equal(TIEBAN_META.tier, "scholarly");
  const json = JSON.parse(readFileSync(new URL("../data/tieban.json", import.meta.url), "utf8"));
  const { default: inline } = await import("../dist/tieban.data.js");
  assert.deepEqual(inline, json);
  assert.deepEqual(TIEBAN, json.entries);
});

test("術語 鐵版神數/考刻/刻分/六親考證 入詞表且註明不可重算", () => {
  for (const t of ["鐵版神數", "考刻", "刻分", "六親考證"]) {
    const g = MINGLI_GLOSSARY.find((x) => x.term === t);
    assert.ok(g, t);
  }
  assert.ok(MINGLI_GLOSSARY.find((x) => x.term === "鐵版神數").zht.includes("不可重算"));
});
