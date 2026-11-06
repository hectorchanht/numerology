import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { QIZHENG_META, QIZHENG_MANSIONS, QIZHENG_SEVEN, QIZHENG_YU, QIZHENG_ZIQI } from "../dist/index.js";

test("二十八宿:28 個、n 1–28、古度總和 365(觜附參)", () => {
  assert.equal(QIZHENG_MANSIONS.length, 28);
  assert.deepEqual(QIZHENG_MANSIONS.map((m) => m.n), Array.from({ length: 28 }, (_, i) => i + 1));
  assert.equal(QIZHENG_MANSIONS[0].name, "角");
  assert.equal(QIZHENG_MANSIONS.reduce((s, m) => s + m.ancientDeg, 0), 365);
  const zi = QIZHENG_MANSIONS.find((m) => m.name === "觜");
  assert.equal(zi.ancientDeg, 0);
  assert.equal(zi.attachedTo, "參");
  for (const m of QIZHENG_MANSIONS) {
    assert.ok(Number.isInteger(m.hip) && m.hip > 0, m.name);
    assert.ok(m.star.trim().length > 0, m.name);
  }
});

test("距星 J2000 黃經由角起逐宿遞增,mod 360 只繞一次", () => {
  let wraps = 0;
  for (let i = 0; i < 28; i++) {
    const a = QIZHENG_MANSIONS[i].lonJ2000;
    const b = QIZHENG_MANSIONS[(i + 1) % 28].lonJ2000;
    assert.ok(a >= 0 && a < 360);
    if (b < a) wraps++;
    else assert.ok(b > a);
  }
  assert.equal(wraps, 1);
  // 角宿一 Spica J2000 黃經約 203°50′
  assert.ok(Math.abs(QIZHENG_MANSIONS[0].lonJ2000 - 203.84) < 0.01);
});

test("七政七個;四餘四個、cite 非空、紫氣 modern", () => {
  assert.deepEqual(QIZHENG_SEVEN.map((s) => s.body), ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"]);
  assert.deepEqual(QIZHENG_YU.map((y) => y.id), ["luohou", "jidu", "yuebei", "ziqi"]);
  for (const y of QIZHENG_YU) {
    assert.ok(y.cite.trim().length > 0, y.id);
    assert.ok(y.formula.startsWith(y.id === "ziqi" ? "流派公式" : "推算公式"), y.id);
  }
  assert.equal(QIZHENG_YU.find((y) => y.id === "ziqi").tier, "modern");
  assert.ok(QIZHENG_YU.find((y) => y.id === "luohou").variants.some((v) => v.includes("推步捷例")));
});

test("紫氣周期同《星學大成》10228 日相差 < 1%", () => {
  const period = 360 / QIZHENG_ZIQI.degPerDay;
  assert.ok(Math.abs(period - 10228) / 10228 < 0.01, String(period));
  assert.ok(QIZHENG_ZIQI.lonAtEpoch >= 0 && QIZHENG_ZIQI.lonAtEpoch < 360);
  assert.ok(QIZHENG_ZIQI.epochJd > 2358000 && QIZHENG_ZIQI.epochJd < 2358100);
});

test("meta 未校對;JSON 同內聯 data.ts 一致", async () => {
  assert.equal(QIZHENG_META.reviewed, false);
  const json = JSON.parse(readFileSync(new URL("../data/qizheng.json", import.meta.url), "utf8"));
  const { default: inline } = await import("../dist/qizheng.data.js");
  assert.deepEqual(inline, json);
});

test("28 宿古度逐宿對《六壬大全》卷十一(正度 + 初度 1)", () => {
  const exp = { 角: 13, 亢: 9, 氐: 16, 房: 6, 心: 7, 尾: 18, 箕: 10, 斗: 23, 牛: 7, 女: 11, 虛: 9, 危: 16, 室: 18, 壁: 10, 奎: 18, 婁: 12, 胃: 16, 昴: 11, 畢: 16, 觜: 0, 參: 10, 井: 31, 鬼: 3, 柳: 13, 星: 6, 張: 18, 翼: 20, 軫: 18 };
  for (const m of QIZHENG_MANSIONS) assert.equal(m.ancientDeg, exp[m.name], m.name);
});

test("十二宮過宮界:12 支各一、界宿非觜、界度 < 宿闊、宮闊 28–33 合 365", async () => {
  const { QIZHENG_GONG } = await import("../dist/index.js");
  const b = QIZHENG_GONG.boundaries;
  assert.equal(b.length, 12);
  assert.equal(new Set(b.map((x) => x.zhi)).size, 12);
  assert.equal(new Set(b.map((x) => x.ci)).size, 12);
  const start = {};
  let acc = 0;
  for (const m of QIZHENG_MANSIONS) { start[m.name] = acc; acc += m.ancientDeg; }
  for (const x of b) {
    const m = QIZHENG_MANSIONS.find((y) => y.name === x.xiu);
    assert.ok(m && m.ancientDeg > 0, x.xiu);
    assert.ok(x.deg >= 0 && x.deg < m.ancientDeg, x.xiu);
  }
  // 《星學大成》卷一〈約二十八宿過宫度數歌〉逐界
  assert.deepEqual(b.map((x) => `${x.zhi}${x.xiu}${x.deg}`), ["卯氐1", "寅尾3", "丑斗3", "子女1", "亥危12", "戌奎1", "酉胃3", "申畢6", "未井8", "午柳3", "巳張14", "辰軫9"]);
  const p = b.map((x) => start[x.xiu] + x.deg);
  const w = p.map((v, i) => (((p[(i + 1) % 12] - v) % 365) + 365) % 365);
  for (const x of w) assert.ok(x >= 28 && x <= 33, String(w));
  assert.equal(w.reduce((s, x) => s + x, 0), 365);
  assert.equal(b.find((x) => x.zhi === "亥").ci, "娵訾");
  assert.ok(QIZHENG_GONG.cite.includes("危十二度亥中陳"));
  assert.ok(QIZHENG_GONG.variants.some((v) => v.includes("張果星宗")));
});

test("十二宮名:命宮起逆排 12 宮;安命規則有出處", async () => {
  const { QIZHENG_GONG } = await import("../dist/index.js");
  assert.deepEqual(QIZHENG_GONG.houses, ["命宮", "財帛", "兄弟", "田宅", "男女", "奴僕", "妻妾", "疾厄", "遷移", "官祿", "福德", "相貌"]);
  assert.ok(QIZHENG_GONG.mingCite.includes("卯"));
  assert.ok(QIZHENG_GONG.housesCite.includes("官禄"));
});

