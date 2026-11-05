import test from "node:test";
import assert from "node:assert/strict";
import { castBazi, natalRelations, externalRelations, suiYunBingLin, tianKeDiChong } from "../dist/index.js";

const kinds = (rs) => rs.map((r) => `${r.kind}:${r.chars.join("")}:${r.hua ?? ""}`).sort();
const cast = (year, month, day, hour, minute) => castBazi({ year, month, day, hour, minute, gender: "男" }).fourPillars;

test("1990-05-15 庚午 辛巳 庚辰 癸未", () => {
  assert.deepEqual(kinds(natalRelations(cast(1990, 5, 15, 14, 30))), ["三会:巳午未:火", "六合:午未:土"]);
});

test("1990-05-30 庚午 辛巳 乙未 壬午", () => {
  const a = natalRelations(cast(1990, 5, 30, 11, 30));
  const k = kinds(a);
  for (const x of ["天干五合:乙庚:金", "六合:午未:土", "自刑:午午:", "三会:巳午未:火"]) assert.ok(k.includes(x), x);
  const he = a.filter((r) => r.kind === "六合");
  assert.equal(he.length, 2);
  assert.ok(a.some((r) => r.kind === "天干五合" && r.between.join() === "year,day"));
});

test("半合", () => {
  const k = kinds(natalRelations({
    year: { gan: "甲", zhi: "申" }, month: { gan: "丙", zhi: "子" },
    day: { gan: "戊", zhi: "寅" }, hour: { gan: "庚", zhi: "午" },
  }));
  for (const x of ["半合:申子:水", "半合:寅午:火", "相冲:寅申:", "相冲:子午:"]) assert.ok(k.includes(x), x);
  assert.ok(!k.some((s) => s.startsWith("三合")));
});

test("歲運並臨 / 天剋地沖 / 外來", () => {
  assert.equal(suiYunBingLin("甲子", "甲子"), true);
  assert.equal(suiYunBingLin("甲子", "乙丑"), false);
  const n = { year: { gan: "甲", zhi: "子" }, month: { gan: "丙", zhi: "子" }, day: { gan: "甲", zhi: "寅" }, hour: { gan: "庚", zhi: "午" } };
  assert.deepEqual(tianKeDiChong("庚申", n), ["day"]);
  const ext = externalRelations({ ganZhi: "丙子", role: "liunian" }, cast(1990, 5, 15, 14, 30));
  assert.ok(ext.some((r) => r.kind === "相冲" && r.chars.join("") === "子午" && r.between.join() === "liunian,year"));
  assert.ok(ext.every((r) => r.between.includes("liunian")));
});
