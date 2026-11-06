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
  // 跨 0°:奎/婁一帶(距星 ~ 0° 附近)兩側都有宿、且度數連續
  const lo = qizhengMansionAt(359.99, ms), hi = qizhengMansionAt(0.01, ms);
  assert.ok(lo.modern.name && hi.modern.name);
  const gap = norm(0.01 - 359.99);
  const d = lo.modern.name === hi.modern.name ? hi.modern.degree - lo.modern.degree : null;
  if (d !== null) assert.ok(Math.abs(norm(d) - gap) < 1e-6);
  else assert.ok(hi.modern.degree < gap + 1e-6);
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
