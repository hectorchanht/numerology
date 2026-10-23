import { test } from "node:test";
import assert from "node:assert/strict";
import {
  paigua, palaceOf, qinOf, beastOf, xunKong, ganzhiForDate,
} from "../dist/index.js";

/* ── 卦宮覆蓋:64 卦恰好各歸一宮 ─────────────────────────── */
test("64 卦各有唯一卦宮(八宮 × 八卦)", () => {
  const seen = new Map();
  for (let b = 0; b < 64; b++) {
    const bits = [0, 1, 2, 3, 4, 5].map((i) => (b >> i) & 1);
    const p = palaceOf(bits);
    const key = bits.join("");
    assert.ok(!seen.has(key), `重複: ${key}`);
    seen.set(key, p);
  }
  assert.equal(seen.size, 64);
  const palaces = new Set([...seen.values()].map((p) => p.palace));
  assert.deepEqual([...palaces].sort(), ["乾", "兌", "離", "震", "巽", "坎", "艮", "坤"].sort());
});

/* ── 例1:乾為天,甲子日,月建寅(手算核對) ─────────────────── */
test("乾為天/甲子日/月建寅:納甲六親六獸世應旬空月破日破", () => {
  const r = paigua([7, 7, 7, 7, 7, 7], "甲", "子", "寅");
  assert.equal(r.palace, "乾");
  assert.equal(r.palaceWuxing, "金");
  assert.equal(r.shape, "八純");
  assert.equal(r.shi, 6);
  assert.equal(r.ying, 3);
  assert.deepEqual(r.kong, ["戌", "亥"]); // 甲子旬空戌亥
  const y = r.yaos;
  assert.deepEqual(y.map((x) => x.ganzhi), ["甲子", "甲寅", "甲辰", "壬午", "壬申", "壬戌"]);
  assert.deepEqual(y.map((x) => x.qin), ["子孫", "妻財", "父母", "官鬼", "兄弟", "父母"]);
  assert.deepEqual(y.map((x) => x.beast), ["青龍", "朱雀", "勾陳", "螣蛇", "白虎", "玄武"]);
  assert.equal(y[5].shiYing, "世");
  assert.equal(y[2].shiYing, "應");
  assert.equal(y[5].xunKong, true); // 壬戌旬空
  assert.equal(y[0].xunKong, false);
  assert.equal(y[3].riPo, true); // 午沖子(日辰)
  assert.equal(y[4].yuePo, true); // 申沖寅(月建)
  assert.equal(y[0].moving, false);
});

/* ── 例2:坤為地,甲午日,月建卯(手算核對) ──────────────────── */
test("坤為地/甲午日/月建卯:納甲六親六獸世應旬空月破", () => {
  const r = paigua([8, 8, 8, 8, 8, 8], "甲", "午", "卯");
  assert.equal(r.palace, "坤");
  assert.equal(r.palaceWuxing, "土");
  assert.equal(r.shape, "八純");
  assert.deepEqual(r.kong, ["辰", "巳"]); // 甲午旬空辰巳
  const y = r.yaos;
  assert.deepEqual(y.map((x) => x.ganzhi), ["乙未", "乙巳", "乙卯", "癸丑", "癸亥", "癸酉"]);
  assert.deepEqual(y.map((x) => x.qin), ["兄弟", "父母", "官鬼", "兄弟", "妻財", "子孫"]);
  assert.equal(y[1].xunKong, true); // 乙巳旬空
  assert.equal(y[5].yuePo, true); // 酉沖卯(月建)
  assert.equal(y[5].shiYing, "世");
});

/* ── 世應:一世/遊魂/歸魂 ─────────────────────────────────── */
test("世應位置:姤一世/晉遊魂/大有歸魂", () => {
  const gou = paigua([8, 7, 7, 7, 7, 7], "甲", "子", "寅"); // 天風姤
  assert.equal(gou.palace, "乾");
  assert.equal(gou.shape, "一世");
  assert.equal(gou.shi, 1);
  assert.equal(gou.ying, 4);
  const jin = paigua([8, 8, 8, 7, 8, 7], "甲", "子", "寅"); // 火地晉
  assert.equal(jin.shape, "遊魂");
  assert.equal(jin.shi, 4);
  assert.equal(jin.ying, 1);
  const dayou = paigua([7, 7, 7, 7, 8, 7], "甲", "子", "寅"); // 火天大有
  assert.equal(dayou.shape, "歸魂");
  assert.equal(dayou.shi, 3);
  assert.equal(dayou.ying, 6);
});

/* ── 六親/六獸/旬空單元 ───────────────────────────────────── */
test("qinOf:乾金宮六支(古典標準)", () => {
  assert.equal(qinOf("金", "水"), "子孫");
  assert.equal(qinOf("金", "木"), "妻財");
  assert.equal(qinOf("金", "土"), "父母");
  assert.equal(qinOf("金", "火"), "官鬼");
  assert.equal(qinOf("金", "金"), "兄弟");
});

test("beastOf:六獸歌起點", () => {
  assert.equal(beastOf("甲", 1), "青龍");
  assert.equal(beastOf("乙", 6), "玄武");
  assert.equal(beastOf("丙", 1), "朱雀");
  assert.equal(beastOf("戊", 1), "勾陳");
  assert.equal(beastOf("己", 1), "螣蛇");
  assert.equal(beastOf("庚", 1), "白虎");
  assert.equal(beastOf("壬", 1), "玄武");
  assert.equal(beastOf("癸", 3), "朱雀"); // 玄武起初爻,三爻為朱雀
});

test("xunKong:甲子旬空戌亥/甲午旬空辰巳/壬戌(甲寅旬)空子丑", () => {
  assert.deepEqual(xunKong("甲", "子"), ["戌", "亥"]);
  assert.deepEqual(xunKong("甲", "午"), ["辰", "巳"]);
  assert.deepEqual(xunKong("壬", "戌"), ["子", "丑"]);
});

/* ── 日期取干支(節氣月建) ─────────────────────────────────── */
test("ganzhiForDate:立春前後月建切換(2024-02-03 丑月 / 2024-02-05 寅月)", () => {
  const before = ganzhiForDate(2024, 2, 3);
  const after = ganzhiForDate(2024, 2, 5);
  assert.equal(before.monthBranch, "丑");
  assert.equal(after.monthBranch, "寅");
});

test("ganzhiForDate:相鄰兩日干支遞進", () => {
  const stems = "甲乙丙丁戊己庚辛壬癸";
  const branches = "子丑寅卯辰巳午未申酉戌亥";
  const a = ganzhiForDate(2024, 5, 1);
  const b = ganzhiForDate(2024, 5, 2);
  assert.equal(stems[(stems.indexOf(a.dayStem) + 1) % 10], b.dayStem);
  assert.equal(branches[(branches.indexOf(a.dayBranch) + 1) % 12], b.dayBranch);
});

/* ── 非法輸入 ─────────────────────────────────────────────── */
test("非法輸入拋錯", () => {
  assert.throws(() => paigua([7, 7, 7, 7, 7, 5], "甲", "子", "寅"));
  assert.throws(() => paigua([7, 7, 7, 7, 7, 7], "X", "子", "寅"));
  assert.throws(() => palaceOf([1, 1]));
});
