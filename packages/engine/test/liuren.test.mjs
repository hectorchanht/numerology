import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Solar } from "lunar-javascript";
import { castLiuren, castLiurenKe, castChart } from "../dist/index.js";

const json = JSON.parse(readFileSync(new URL("../../knowledge/data/liuren.json", import.meta.url), "utf8"));
const ke = (day, hour, jiang) => castLiurenKe({ dayGan: day[0], dayZhi: day[1], hourZhi: hour, yueJiang: jiang });

test("書例:逐條推得 method / sub / 三傳 同 expected(及書載三傳)", () => {
  for (const e of json.examples) {
    const { sanChuan: s } = ke(e.day, e.hour, e.jiang);
    assert.deepEqual(
      { method: s.method, sub: s.sub, chu: s.chu, zhong: s.zhong, mo: s.mo },
      e.expected,
      e.id,
    );
    if (e.bookSanChuan) assert.deepEqual([s.chu, s.zhong, s.mo], e.bookSanChuan, e.id);
  }
});

test("涉害重數:書載 workedCounts 同引擎計數一致", () => {
  let n = 0;
  for (const w of json.shehai.workedCounts) {
    const e = json.examples.find((x) => x.day === w.day && x.expected.method === "shehai");
    if (!e) continue;
    const r = ke(e.day, e.hour, e.jiang);
    assert.ok(r.steps.some((s) => s.includes(`${w.shen}加${w.on} ${w.count} 重`)), `${w.day} ${w.shen}加${w.on}`);
    n++;
  }
  assert.ok(n >= 6);
});

test("伏吟:天盤每位等於地盤", () => {
  const r = ke("甲子", "子", "子");
  assert.deepEqual(r.tianPan, ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]);
});

test("中氣交接:2024 秋分交氣前一分鐘巳將、後一分鐘辰將", () => {
  const s = Solar.fromYmd(2024, 6, 1).getLunar().getJieQiTable()["秋分"];
  const t = new Date(Date.UTC(s.getYear(), s.getMonth() - 1, s.getDay(), s.getHour(), s.getMinute()));
  const shift = (min) => {
    const d = new Date(t.getTime() + min * 60000);
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), hour: d.getUTCHours(), minute: d.getUTCMinutes() };
  };
  const birth = { year: 1990, month: 5, day: 15, hour: 12, gender: "男" };
  const before = castLiuren(birth, shift(-1)), after = castLiuren(birth, shift(1));
  assert.equal(before.yueJiang.zhi, "巳");
  assert.equal(before.zhongQi, "處暑");
  assert.equal(after.yueJiang.zhi, "辰");
  assert.equal(after.zhongQi, "秋分");
});

test("子時:日干支同八字日柱", () => {
  const input = { year: 1990, month: 5, day: 15, hour: 23, minute: 30, gender: "男" };
  assert.equal(castLiuren(input).dayGanZhi, castChart(input).bazi.fourPillars.day.ganZhi);
});

test("貴人旦夜", () => {
  const a = ke("甲子", "卯", "子").guiren;
  assert.equal(a.zhi, "丑");
  assert.equal(a.daytime, true);
  const b = ke("壬辰", "卯", "子").guiren;
  assert.equal(b.zhi, "巳");
  assert.equal(b.daytime, true);
  const c = ke("甲子", "酉", "子").guiren;
  assert.equal(c.zhi, "未");
  assert.equal(c.daytime, false);
});

test("天將:12 將各佔一個天盤支,貴人在貴人支", () => {
  const r = ke("甲子", "卯", "子");
  assert.equal(Object.keys(r.jiang).length, 12);
  assert.equal(r.jiang[r.guiren.zhi], "貴人");
});

test("全 60 日 × 12 時 × 12 將都排得出,三傳俱為地支", () => {
  const G = "甲乙丙丁戊己庚辛壬癸", Z = "子丑寅卯辰巳午未申酉戌亥";
  for (let i = 0; i < 60; i++) for (const h of Z) for (const j of Z) {
    const { sanChuan: s } = ke(G[i % 10] + Z[i % 12], h, j);
    for (const x of [s.chu, s.zhong, s.mo]) assert.ok(Z.includes(x), `${G[i % 10]}${Z[i % 12]} ${h} ${j}`);
  }
});

test("steps 非空,cite 指《六壬大全》", () => {
  const r = castLiuren({ year: 1990, month: 5, day: 15, hour: 10, gender: "女" });
  assert.ok(r.steps.length > 0);
  assert.ok(r.cite.work.includes("六壬大全"));
  assert.equal(r.tier, "classical");
});
