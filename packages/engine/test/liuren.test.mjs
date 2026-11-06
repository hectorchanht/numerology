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

test("年底冬至、年初大寒換將(含 1900、2100 邊界)", () => {
  const b = { year: 1990, month: 5, day: 15, hour: 12, gender: "男" };
  const r = castLiuren(b, { year: 2024, month: 12, day: 25, hour: 12 });
  assert.equal(r.zhongQi, "冬至");
  assert.equal(r.yueJiang.zhi, "丑");
  assert.equal(castLiuren(b, { year: 1900, month: 12, day: 31, hour: 12 }).yueJiang.zhi, "丑");
  assert.equal(castLiuren(b, { year: 2100, month: 12, day: 31, hour: 12 }).yueJiang.zhi, "丑");
  const d = castLiuren(b, { year: 2025, month: 1, day: 25, hour: 12 });
  assert.equal(d.zhongQi, "大寒");
  assert.equal(d.yueJiang.zhi, "子");
});

test("重課去重:甲子日子時戌將,二三課同為戌/子,上剋下只一神 → 元首", () => {
  const r = castLiurenKe({ dayGan: "甲", dayZhi: "子", hourZhi: "子", yueJiang: "戌" });
  assert.deepEqual(r.ke.map((k) => k.up + k.down), ["子甲", "戌子", "戌子", "申戌"]);
  const s = r.sanChuan;
  assert.deepEqual([s.method, s.sub, s.chu, s.zhong, s.mo], ["zeike", "元首", "戌", "申", "午"]);
});

test("旬遁:書例遁干、旬空(xun.evidence)逐條推得", async () => {
  const { liurenXun } = await import("../dist/index.js");
  assert.ok(json.xun.evidence.length >= 4);
  for (const e of json.xun.evidence) {
    const x = liurenXun(e.day[0], e.day[1]);
    if (e.dun) for (const [zhi, gan] of Object.entries(e.dun)) assert.equal(x.dun[zhi], gan, `${e.day} ${zhi}`);
    if (e.kong) assert.deepEqual(x.kong, e.kong, e.day);
  }
  const x = liurenXun("甲", "子");
  assert.equal(x.shou, "甲子");
  assert.equal(x.dun["戌"], null);
  assert.equal(x.dun["子"], "甲");
  assert.equal(liurenXun("癸", "亥").shou, "甲寅");
});

test("三傳遁干同旬空;四課上神標旬空", () => {
  const r = ke("甲子", "卯", "子"); // 三傳午卯子;甲子旬空戌亥
  assert.deepEqual(r.xun, { shou: "甲子", kong: ["戌", "亥"] });
  assert.deepEqual(r.chuan.map((c) => [c.zhi, c.dun, c.kong]), [["午", "庚", false], ["卯", "丁", false], ["子", "甲", false]]);
  assert.deepEqual(r.keKong, r.ke.map((k) => k.up === "戌" || k.up === "亥"));
  // 甲子日戌加子(戌時子將…)見書「乃是本旬之空」:戌為初傳時無遁干
  const G = "甲乙丙丁戊己庚辛壬癸", Z = "子丑寅卯辰巳午未申酉戌亥";
  let seen = 0;
  for (let i = 0; i < 60; i++) for (const h of Z) for (const j of Z) {
    const q = ke(G[i % 10] + Z[i % 12], h, j);
    for (const c of q.chuan) {
      assert.equal(c.kong, q.xun.kong.includes(c.zhi));
      assert.equal(c.dun === null, c.kong);
      if (c.kong) seen++;
    }
  }
  assert.ok(seen > 0);
});

test("六親:書例(liuqin.evidence)逐條推得;三傳逐支標六親", async () => {
  const { liurenLiuqin } = await import("../dist/index.js");
  assert.ok(json.liuqin.evidence.length >= 5);
  for (const e of json.liuqin.evidence) assert.equal(liurenLiuqin(e.gan, e.zhi), e.qin, `${e.gan}${e.zhi}`);
  const r = ke("甲子", "卯", "子"); // 三傳午卯子
  assert.deepEqual(r.chuan.map((c) => c.qin), ["子孫", "兄弟", "父母"]);
  assert.equal(liurenLiuqin("戊", "戌"), "兄弟"); // 辰戌丑未屬土
});

test("神煞:甲子日卯時子將逐項落位(三傳午卯子,四課上神亥申酉午)", () => {
  const r = ke("甲子", "卯", "子");
  const by = Object.fromEntries(r.shenSha.map((s) => [s.name, s]));
  assert.deepEqual(by["日德"], { name: "日德", zhi: "寅", at: [] });
  assert.deepEqual(by["干奇"].at, ["初傳", "四課"]);
  assert.deepEqual(by["旬儀"].at, ["末傳"]);
  assert.deepEqual(by["旬丁"].at, ["中傳"]);
  assert.equal(by["驛馬"].zhi, "寅");
  assert.equal(by["旬奇"].zhi, "丑");
  assert.equal(r.shenSha.length, json.shensha.items.length);
});

test("神煞:卷05 乙酉日未時申將三傳亥子丑,旬奇子入傳", () => {
  const r = ke("乙酉", "未", "申");
  assert.deepEqual([r.sanChuan.chu, r.sanChuan.zhong, r.sanChuan.mo], ["亥", "子", "丑"]);
  assert.deepEqual(r.shenSha.find((s) => s.name === "旬奇").at, ["中傳"]);
});

test("神煞:旬丁表同旬遁丁干所臨之支一致", async () => {
  const { liurenXun } = await import("../dist/index.js");
  const xd = json.shensha.items.find((s) => s.name === "旬丁");
  for (const [shou, zhi] of Object.entries(xd.values)) assert.equal(liurenXun(shou[0], shou[1]).dun[zhi], "丁", shou);
});
