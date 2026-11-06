import { test } from "node:test";
import assert from "node:assert/strict";
import { castQizheng, castEphemeris, qizhengMansionAt } from "../dist/index.js";
import { QIZHENG_MANSIONS } from "@numerology/knowledge";

const j2000 = { year: 2000, month: 1, day: 1, hour: 20, gender: "男" };
const r = castQizheng(j2000);
const by = (id) => r.bodies.find((b) => b.id === id);

test("J2000 四餘:羅睺 125.04、計都對衝、月孛 263.35;11 個 body", () => {
  assert.equal(r.bodies.length, 11);
  assert.ok(Math.abs(by("luohou").longitude - 125.04) < 0.01);
  assert.ok(Math.abs(by("jidu").longitude - 305.04) < 0.01);
  assert.ok(Math.abs(by("yuebei").longitude - 263.35) < 0.01);
  assert.ok(r.variants.some((v) => v.includes("推步捷例")));
});

test("七政黃經同 castEphemeris;無經緯度照算;黃經全在 [0,360)", () => {
  const e = castEphemeris(j2000);
  for (const p of e.planets) assert.equal(by(p.planet).longitude, p.longitude);
  assert.equal(by("Mars").retrograde, e.planets.find((p) => p.planet === "Mars").retrograde);
  for (const y of [1900, 2100]) for (const b of castQizheng({ year: y, month: y === 1900 ? 1 : 12, day: y === 1900 ? 1 : 31, hour: 12, gender: "女" }).bodies) assert.ok(b.longitude >= 0 && b.longitude < 360);
});

test("古宿冇觜;宿度喺 [0,宿闊) 內;古度總和 365", () => {
  for (let d = 1; d <= 28; d++) for (const b of castQizheng({ year: 1990 + (d % 30), month: (d % 12) + 1, day: d, hour: 3, gender: "男" }).bodies) {
    assert.notEqual(b.ancient.name, "觜");
    assert.ok(b.ancient.degree >= 0 && b.ancient.degree < 31.01);
    assert.ok(b.mansion.degree >= 0 && b.mansion.degree < 360);
  }
  assert.equal(QIZHENG_MANSIONS.reduce((s, m) => s + m.ancientDeg, 0), 365);
});

test("黃經 = 某宿距星 → 該宿 0 度;跨零度點宿判定正確", () => {
  // J2000 時距星黃經 = lonJ2000;太陽 280.37°,攞最近一宿驗 degree = 差值
  const sun = by("Sun");
  const m = QIZHENG_MANSIONS.find((x) => x.name === sun.mansion.name);
  const d = (((sun.longitude - m.lonJ2000) % 360) + 360) % 360;
  assert.ok(Math.abs(d - sun.mansion.degree) < 1e-6);
  // 黃經 0° 附近(奎/婁區)同 359.9° 唔落空:掃描所有出生日四餘宿名非空
  for (const mo of [1, 4, 7, 10]) for (const b of castQizheng({ year: 2024, month: mo, day: 15, hour: 9, gender: "男" }).bodies) assert.ok(b.mansion.name && b.ancient.name);
});

test("qizhengMansionAt:距星正點 → 該宿 0 度;跨 0° 兩側;古宿無觜、參包觜", () => {
  const ms = Date.UTC(2000, 0, 1, 12);
  const norm = (d) => ((d % 360) + 360) % 360;
  for (const m of QIZHENG_MANSIONS) {
    const a = qizhengMansionAt(m.lonJ2000, ms);
    assert.equal(a.modern.name, m.name);
    assert.ok(a.modern.degree < 1e-9);
  }
  // 跨 0°:兩側必同落一宿(J2000 為室宿),度數差 = 0.02°
  const lo = qizhengMansionAt(359.99, ms), hi = qizhengMansionAt(0.01, ms);
  assert.equal(lo.modern.name, "室");
  assert.equal(hi.modern.name, "室");
  assert.ok(Math.abs(hi.modern.degree - lo.modern.degree - 0.02) < 1e-6);
  // 古宿:掃全周天無觜;觜距星現代點落參
  for (let l = 0; l < 360; l += 0.25) assert.notEqual(qizhengMansionAt(l, ms).ancient.name, "觜");
  // 參古度範圍(10 古度 = 觜附參):起點 = 角距星 + 前面累計古度 × 360/365
  let acc = 0;
  for (const m of QIZHENG_MANSIONS) { if (m.name === "參") break; acc += m.ancientDeg; }
  const lon = (g) => norm(QIZHENG_MANSIONS[0].lonJ2000 + (g * 360) / 365);
  for (const g of [acc + 0.01, acc + 5, acc + 9.99]) assert.equal(qizhengMansionAt(lon(g), ms).ancient.name, "參");
  assert.equal(qizhengMansionAt(lon(acc - 0.01), ms).ancient.name, "畢");
  assert.equal(qizhengMansionAt(lon(acc + 10.01), ms).ancient.name, "井");
});

test("古宿表 軫→角 環繞同 365 古度邊界", () => {
  const ms = Date.UTC(2000, 0, 1, 12);
  const anchor = QIZHENG_MANSIONS[0].lonJ2000;
  const zhen = QIZHENG_MANSIONS.find((m) => m.name === "軫");
  const before = qizhengMansionAt(anchor - 0.01, ms).ancient;
  assert.equal(before.name, "軫");
  assert.ok(before.degree < zhen.ancientDeg && zhen.ancientDeg - before.degree < 0.02);
  const at = qizhengMansionAt(anchor, ms).ancient;
  assert.equal(at.name, "角");
  assert.ok(at.degree < 1e-9);
  // 周天末(365 古度邊緣,浮點差一絲)(差 1e-6°;< 1e-9° 當 0 屬設計)仍落軫而唔溢出
  const edge = qizhengMansionAt(anchor - 1e-6, ms).ancient;
  assert.equal(edge.name, "軫");
  assert.ok(edge.degree < zhen.ancientDeg);
});

test("1900-01-01 / 2100-12-31:全部 body 宿名非空、宿度喺該宿闊內", () => {
  const width = (name) => {
    const i = QIZHENG_MANSIONS.findIndex((m) => m.name === name);
    const nx = QIZHENG_MANSIONS[(i + 1) % 28].lonJ2000;
    return (((nx - QIZHENG_MANSIONS[i].lonJ2000) % 360) + 360) % 360;
  };
  for (const [year, month, day] of [[1900, 1, 1], [2100, 12, 31]]) {
    for (const b of castQizheng({ year, month, day, hour: 12, gender: "女" }).bodies) {
      assert.ok(b.mansion.name && b.ancient.name);
      assert.ok(b.mansion.degree >= 0 && b.mansion.degree < width(b.mansion.name) + 0.05, `${b.id} 現代`);
      const am = QIZHENG_MANSIONS.find((m) => m.name === b.ancient.name);
      assert.ok(b.ancient.degree >= 0 && b.ancient.degree < am.ancientDeg + 1e-9, `${b.id} 古`);
    }
  }
});

import { QIZHENG_GONG } from "@numerology/knowledge";

const ms0 = Date.UTC(2000, 0, 1, 12);
const anc0 = QIZHENG_MANSIONS[0].lonJ2000;
/** 古宿某宿 deg 古度之回歸黃經(J2000) */
const lonOfAnc = (xiu, deg) => {
  let acc = 0;
  for (const m of QIZHENG_MANSIONS) { if (m.name === xiu) break; acc += m.ancientDeg; }
  return (((anc0 + ((acc + deg) * 360) / 365) % 360) + 360) % 360;
};

test("十二宮:過宮界(星學大成)兩側分屬兩宮;軫九→角→氐一屬辰", () => {
  for (const b of QIZHENG_GONG.boundaries) {
    const at = qizhengMansionAt(lonOfAnc(b.xiu, b.deg + 0.01), ms0).gong;
    assert.equal(at.zhi, b.zhi, `${b.xiu}${b.deg}`);
    assert.equal(at.ci, b.ci);
    assert.notEqual(qizhengMansionAt(lonOfAnc(b.xiu, b.deg - 0.01), ms0).gong.zhi, b.zhi);
  }
  for (const [x, d] of [["軫", 9.5], ["角", 0], ["角", 12], ["亢", 3], ["氐", 0.9]]) assert.equal(qizhengMansionAt(lonOfAnc(x, d), ms0).gong.zhi, "辰", `${x}${d}`);
  assert.equal(qizhengMansionAt(lonOfAnc("危", 12.5), ms0).gong.ci, "娵訾");
  for (const b of r.bodies) assert.ok(b.gong.zhi && b.gong.ci && b.house, b.id);
});

test("命宮:日宮加生時數至卯;卯時命宮 = 日宮,午時逆退三宮;十二宮由命宮逆排", () => {
  const Z = "子丑寅卯辰巳午未申酉戌亥";
  const base = { year: 2024, month: 6, day: 15, minute: 0, gender: "男" };
  const sunZ = (h) => castQizheng({ ...base, hour: h }).bodies.find((b) => b.id === "Sun").gong.zhi;
  const at6 = castQizheng({ ...base, hour: 6 });
  assert.equal(at6.minggong.hourZhi, "卯");
  assert.equal(at6.minggong.zhi, sunZ(6));
  const at12 = castQizheng({ ...base, hour: 12 });
  assert.equal(at12.minggong.hourZhi, "午");
  assert.equal(Z.indexOf(at12.minggong.zhi), (Z.indexOf(sunZ(12)) + 3 - 6 + 12) % 12);
  assert.equal(castQizheng({ ...base, hour: 23 }).minggong.hourZhi, "子");
  // 十二宮:命宮起逆地支次序;第十宮官祿 = 命宮支 − 9
  const h = at12.houses;
  assert.equal(h.length, 12);
  assert.equal(h[0].name, "命宮");
  assert.equal(h[0].zhi, at12.minggong.zhi);
  assert.equal(h[9].name, "官祿");
  assert.equal(Z.indexOf(h[9].zhi), (Z.indexOf(h[0].zhi) + 12 - 9) % 12);
  // 各曜宮名 = 所落宮之十二宮名
  for (const b of at12.bodies) assert.equal(b.house, h.find((x) => x.zhi === b.gong.zhi).name);
});
