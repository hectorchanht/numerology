import { test } from "node:test";
import assert from "node:assert/strict";
import { castQimen, isWuBuYuShi } from "../dist/index.js";

/**
 * 驗證向量:2026-10-11 22:00(戊午日癸亥時),寒露(10-08 14:29)後。
 * 對照 guoxueju.com「時家·轉盤·拆補定局」盤:寒露中元陰遁9局,
 * 旬首甲寅(空亡子丑),值符天輔/值使杜門。
 * 地盤:離9戊/艮8己/兌7庚/乾6辛/中5壬/巽4癸/震3丁/坤2丙/坎1乙。
 * 天盤:巽4天輔/癸、震3天沖/丁、坤2天芮+天禽/丙+壬、坎1天蓬/乙、
 *      離9天英/戊、艮8天任/己、兌7天柱/庚、乾6天心/辛。
 * 八門:巽4杜、震3傷、坤2死、坎1休、離9景、艮8生、兌7驚、乾6開。
 * 格局:巽4星伏吟+門伏吟+擊刑(癸)+入墓(癸)+馬星(時支亥→巳)。
 */
function at(gong) {
  const r = castQimen({ year: 2026, month: 10, day: 11, hour: 22, minute: 0 });
  return { r, p: r.palaces.find((x) => x.gong === gong) };
}

test("qimen: 定局(寒露中元陰遁9局)", () => {
  const { r } = at(1);
  assert.equal(r.jieqi, "寒露");
  assert.equal(r.yuan, "中元");
  assert.equal(r.dun, "陰遁");
  assert.equal(r.ju, 9);
  assert.equal(r.dayGanZhi, "戊午");
  assert.equal(r.timeGanZhi, "癸亥");
  assert.equal(r.xunShou, "甲寅");
  assert.equal(r.xunKong, "子丑");
  assert.equal(r.zhiFu, "天輔");
  assert.equal(r.zhiShi, "杜門");
});

test("qimen: 地盤三奇六儀(陰遁逆布)", () => {
  const { r } = at(1);
  const dp = Object.fromEntries(r.palaces.map((p) => [p.gong, p.diPan]));
  assert.deepEqual(dp, {
    1: "乙", 2: "丙", 3: "丁", 4: "癸", 5: "壬", 6: "辛", 7: "庚", 8: "己", 9: "戊",
  });
});

test("qimen: 天盤九星+天盤干", () => {
  const { r } = at(1);
  const by = (g) => r.palaces.find((x) => x.gong === g);
  assert.equal(by(4).star, "天輔");
  assert.equal(by(4).tianPan, "癸");
  assert.equal(by(3).star, "天沖");
  assert.equal(by(3).tianPan, "丁");
  assert.equal(by(2).star, "天芮+天禽");
  assert.equal(by(2).tianPan, "丙+壬");
  assert.equal(by(1).star, "天蓬");
  assert.equal(by(1).tianPan, "乙");
  assert.equal(by(9).star, "天英");
  assert.equal(by(9).tianPan, "戊");
  assert.equal(by(8).star, "天任");
  assert.equal(by(8).tianPan, "己");
  assert.equal(by(7).star, "天柱");
  assert.equal(by(7).tianPan, "庚");
  assert.equal(by(6).star, "天心");
  assert.equal(by(6).tianPan, "辛");
});

test("qimen: 八門(值使杜門加時干宮,陰逆轉布)", () => {
  const { r } = at(1);
  const men = Object.fromEntries(r.palaces.map((p) => [p.gong, p.men]));
  assert.deepEqual(men, {
    1: "休門", 2: "死門", 3: "傷門", 4: "杜門", 5: "", 6: "開門", 7: "驚門", 8: "生門", 9: "景門",
  });
});

test("qimen: 格局(伏吟/擊刑/入墓/空亡/馬星)", () => {
  const { r } = at(1);
  const by = (g) => r.palaces.find((x) => x.gong === g);
  const p4 = by(4);
  assert.ok(p4.patterns.includes("星伏吟"), "巽4星伏吟");
  assert.ok(p4.patterns.includes("門伏吟"), "巽4門伏吟");
  assert.ok(p4.patterns.includes("擊刑"), "巽4癸擊刑");
  assert.ok(p4.patterns.includes("入墓"), "巽4癸入墓辰");
  assert.ok(p4.maXing, "時支亥馬在巳→巽4");
  assert.ok(by(2).patterns.includes("星伏吟"), "坤2天芮星伏吟");
  assert.ok(by(1).kongWang, "坎1子空亡");
  assert.ok(!by(9).kongWang, "離9午非空亡");
});

test("qimen: 五不遇時(時干剋日干)", () => {
  assert.equal(isWuBuYuShi("甲", "戊"), true); // 甲木剋戊土
  assert.equal(isWuBuYuShi("癸", "戊"), false); // 土剋水,癸不剋戊
});

test("qimen: 陽遁例(2026-04-06 清明,陽遁4局)", () => {
  // 2026-04-06 10:00:清明(04-04)後,節氣日干?=上中下三元按日干計
  const r = castQimen({ year: 2026, month: 4, day: 6, hour: 10, minute: 0 });
  assert.equal(r.jieqi, "清明");
  assert.equal(r.dun, "陽遁");
  assert.ok([4, 1, 7].includes(r.ju), `清明局數應為4/1/7,得${r.ju}`);
  // 地盤陽遁順布:戊起局數宮
  const dp = Object.fromEntries(r.palaces.map((p) => [p.gong, p.diPan]));
  assert.equal(dp[r.ju], "戊");
});
