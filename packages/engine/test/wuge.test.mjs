import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeName, wuxingOfStrokes, shuliOf, shuliInfo } from "../dist/index.js";

/**
 * 五格剖象引擎測試。手工驗算(權重 天10/人30/地20/外5/總25/三才10):
 * - 陳大文:陳16/大3/文4。天17(吉)/人19(凶)/地7(吉)/外5(吉)/總23(吉);
 *   三才 金水金=吉;score=10+0+20+5+25+10=70。
 * - 王大(單姓單名):王4/大3。天5(吉)/人7(吉)/地4(凶)/外2特例(凶)/總7(吉);
 *   三才 土金火=凶(360doc+美名騰全表;非半吉);score=10+30+0+0+25+0=65。
 * - 歐陽修(複姓):歐15/陽17/修10(康熙人部八畫)。天32(吉)/人27(半吉)/地11(吉)/
 *   外16(吉)/總42(凶);三才 木金木=凶;score=10+18+20+5+0+0=53。
 */

test("wuge: 陳大文 五格/五行/數理", () => {
  const r = analyzeName("陳", "大文");
  assert.deepEqual(r.chars, [
    { char: "陳", strokes: 16 },
    { char: "大", strokes: 3 },
    { char: "文", strokes: 4 },
  ]);
  assert.equal(r.tian.strokes, 17);
  assert.equal(r.tian.wuxing, "金");
  assert.equal(r.tian.shuli, 17);
  assert.equal(r.tian.luck, "吉");
  assert.equal(r.ren.strokes, 19);
  assert.equal(r.ren.luck, "凶");
  assert.equal(r.ren.wuxing, "水");
  assert.equal(r.di.strokes, 7);
  assert.equal(r.di.luck, "吉");
  assert.equal(r.wai.strokes, 5);
  assert.equal(r.wai.luck, "吉");
  assert.equal(r.zong.strokes, 23);
  assert.equal(r.zong.luck, "吉");
  assert.equal(r.zong.shuliName, "旭日東昇");
  assert.deepEqual(r.sancai, { tian: "金", ren: "水", di: "金", combo: "金水金", luck: "吉" });
  assert.equal(r.score, 70);
});

test("wuge: 王大 單姓單名外格特例=2", () => {
  const r = analyzeName("王", "大");
  assert.equal(r.tian.strokes, 5);
  assert.equal(r.ren.strokes, 7);
  assert.equal(r.di.strokes, 4);
  assert.equal(r.wai.strokes, 2);
  assert.equal(r.wai.luck, "凶");
  assert.equal(r.zong.strokes, 7);
  assert.deepEqual(r.sancai, { tian: "土", ren: "金", di: "火", combo: "土金火", luck: "凶" });
  assert.equal(r.score, 65);
});

test("wuge: 歐陽修 複姓", () => {
  const r = analyzeName("歐陽", "修");
  assert.deepEqual(r.chars.map((c) => c.strokes), [15, 17, 10]);
  assert.equal(r.tian.strokes, 32);
  assert.equal(r.tian.luck, "吉");
  assert.equal(r.ren.strokes, 27);
  assert.equal(r.ren.luck, "半吉");
  assert.equal(r.di.strokes, 11);
  assert.equal(r.di.luck, "吉");
  assert.equal(r.wai.strokes, 16);
  assert.equal(r.wai.luck, "吉");
  assert.equal(r.zong.strokes, 42);
  assert.equal(r.zong.luck, "凶");
  assert.deepEqual(r.sancai, { tian: "木", ren: "金", di: "木", combo: "木金木", luck: "凶" });
  assert.equal(r.score, 53);
});

test("wuge: 巡 取康熙巛部6畫(非走部10畫)", () => {
  const r = analyzeName("巡", "大");
  assert.equal(r.chars[0].strokes, 6);
});

test("wuge: 簡體轉繁體由調用方負責;此處直接測繁體", () => {
  const r = analyzeName("劉", "龍");
  assert.deepEqual(r.chars.map((c) => c.strokes), [15, 16]);
});

test("wuge: 非法輸入拋錯", () => {
  assert.throws(() => analyzeName("", "大文"), /姓氏須為/);
  assert.throws(() => analyzeName("歐陽陳", "大"), /姓氏須為/);
  assert.throws(() => analyzeName("王", ""), /名字須為/);
  assert.throws(() => analyzeName("王", "大文豪"), /名字須為/);
});

test("wuge: 查無筆畫的字拋錯並列明", () => {
  // U+2000B 在基本區外,數據未覆蓋
  assert.throws(() => analyzeName("𠀋", "大"), /查無「𠀋」字康熙筆畫/);
});

test("wuge: wuxingOfStrokes 尾數規則", () => {
  assert.equal(wuxingOfStrokes(11), "木");
  assert.equal(wuxingOfStrokes(23), "火");
  assert.equal(wuxingOfStrokes(5), "土");
  assert.equal(wuxingOfStrokes(17), "金");
  assert.equal(wuxingOfStrokes(10), "水");
  assert.equal(wuxingOfStrokes(20), "水");
});

test("wuge: shuliOf 超過81減80", () => {
  assert.equal(shuliOf(81), 81);
  assert.equal(shuliOf(82), 2);
  assert.equal(shuliOf(100), 20);
  const i = shuliInfo(23);
  assert.equal(i.luck, "吉");
  assert.equal(i.name, "旭日東昇");
});
