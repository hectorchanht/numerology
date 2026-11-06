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

const N = (y, m, d, h) => ({
  year: { gan: y[0], zhi: y[1] }, month: { gan: m[0], zhi: m[1] }, day: { gan: d[0], zhi: d[1] }, hour: { gan: h[0], zhi: h[1] },
});
const ext = (gz, natal, role = "liunian") => externalRelations({ ganZhi: gz, role }, natal);
const find = (rs, kind, chars) => rs.find((r) => r.kind === kind && r.chars.join("") === chars);

test("外來三合 / 三會:跨外來 + 原局", () => {
  // 原局申、辰 + 流年子 → 申子辰三合水(子由外來補齊)
  const a = ext("丙子", N("甲申", "丙寅", "戊辰", "庚午"));
  const sh = find(a, "三合", "申子辰");
  assert.ok(sh && sh.hua === "水");
  assert.deepEqual(sh.between, ["year", "liunian", "day"]);
  // 原局寅、卯 + 大運辰 → 寅卯辰三會木
  const b = ext("甲辰", N("庚寅", "己卯", "丙午", "壬子"), "dayun");
  const hui = find(b, "三会", "寅卯辰");
  assert.ok(hui && hui.hua === "木");
  assert.deepEqual(hui.between, ["year", "month", "dayun"]);
  // 原局自己已成嘅半合(申子)唔應出現喺外來列表
  assert.ok(!find(ext("丁未", N("甲申", "丙子", "戊寅", "庚午")), "半合", "申子"));
});

test("相刑:寅巳申 / 子卯 / 自刑", () => {
  const a = ext("丁巳", N("甲寅", "丙子", "庚申", "壬午"));
  assert.ok(find(a, "相刑", "寅巳"), "寅巳刑");
  assert.ok(find(a, "相刑", "巳申"), "巳申刑");
  assert.ok(!find(a, "相刑", "寅申"), "寅申唔經外來,唔列");
  assert.ok(find(ext("乙卯", N("甲子", "丙寅", "庚午", "壬午")), "相刑", "子卯"));
  const self = find(ext("丙午", N("甲子", "丙寅", "庚午", "壬申")), "自刑", "午午");
  assert.ok(self);
  assert.deepEqual(self.between, ["liunian", "day"]);
  // 非自刑支(子)同支唔算自刑
  assert.ok(!find(ext("丙子", N("甲子", "丙寅", "庚午", "壬申")), "自刑", "子子"));
});

test("相害 / 相破", () => {
  const a = ext("乙未", N("甲子", "丙寅", "庚戌", "壬申"));
  assert.ok(find(a, "相害", "子未"), "子未害");
  assert.ok(find(a, "相破", "未戌"), "未戌破");
});

test("天剋地沖:無命中回傳 []", () => {
  const n = N("甲子", "丙子", "甲寅", "庚午");
  assert.deepEqual(tianKeDiChong("庚寅", n), []); // 庚剋甲但寅唔沖子/寅/午
  assert.deepEqual(tianKeDiChong("壬申", n), []); // 申沖寅但壬唔剋甲
  assert.deepEqual(tianKeDiChong("壬午", n), ["month"]); // 對照:壬剋丙、午沖子
});
