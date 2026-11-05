import { test } from "node:test";
import assert from "node:assert/strict";
import { castChart, castEphemeris, castJyotish, castEgyptian, castMetonic } from "../dist/index.js";

const SAMPLE = { year: 1990, month: 3, day: 18, hour: 9, minute: 30, gender: "男", longitude: 114.17, latitude: 22.32 };

test("Jyotish:ayanamsa 在 Lahiri 常見值附近;九運共 120 年、首運為部分", () => {
  const r = castJyotish(castEphemeris(SAMPLE));
  // Lahiri 1990 約 23°43′(J2000 約 23.85°,每年約 50″)
  assert.ok(Math.abs(r.ayanamsa - 23.72) < 0.05, String(r.ayanamsa));
  const j2000 = castJyotish(castEphemeris({ ...SAMPLE, year: 2000, month: 1, day: 1, hour: 20, minute: 0 }));
  assert.ok(Math.abs(j2000.ayanamsa - 23.85) < 0.03, String(j2000.ayanamsa));
  assert.equal(r.dashas.length, 9);
  assert.ok(r.dashas[0].partial && !r.dashas[1].partial);
  const total = r.dashas.reduce((a, d) => a + d.years, 0);
  assert.ok(Math.abs(total - (120 - 7 * 0) ) <= 20, "首運折算後少於 120");
  assert.ok(Math.abs(r.dashas[8].endAge - total) < 1e-9);
  assert.equal(r.dashas[0].lord, r.nakshatra.lord);
  assert.ok(r.elapsed >= 0 && r.elapsed < 1);
  assert.equal(r.nakshatra.n, Math.floor(r.moonSidereal / (360 / 27)) + 1);
});

test("埃及民用曆:紀元日為第 1 年 Thoth 1;已知換算", () => {
  const sky = castEphemeris(SAMPLE);
  const r = castEgyptian(SAMPLE, sky);
  // Censorinus《De die natali》21:公元 139 年埃及元旦 Thoth 1 = 儒略曆 7 月 20 日(JDN 1772028)= 公曆 139-07-19
  const t = castEgyptian({ ...SAMPLE, year: 139, month: 7, day: 19 }, sky);
  assert.deepEqual([t.jdn, t.year, t.month, t.day], [1772028, 887, "Thoth", 1]);
  const prev = castEgyptian({ ...SAMPLE, year: 139, month: 7, day: 18 }, sky);
  assert.deepEqual([prev.year, prev.month, prev.day], [886, "Epagomenae", 5]);
  assert.equal(r.face.sign, "Pisces");
  assert.equal(r.face.index, 2); // 太陽 27° Pisces → 第三 face
  assert.equal(r.face.ruler, "Mars");
  assert.ok(r.day >= 1 && r.day <= 30);
});

test("Metonic:金數、epact、復活節", () => {
  const r = castMetonic({ year: 2026, month: 6, day: 1 });
  assert.equal(r.golden, 13);
  assert.equal(r.epact, 11);
  assert.deepEqual(r.easter, { month: 4, day: 5 });
  assert.deepEqual(castMetonic({ year: 2000, month: 6, day: 1 }).easter, { month: 4, day: 23 });
  assert.deepEqual(castMetonic({ year: 1990, month: 6, day: 1 }).easter, { month: 4, day: 15 });
  assert.equal(r.leaps.length, 19);
  // 春節前出生:農曆年為上一年,閏月列表由此起
  const jan = castMetonic({ year: 1990, month: 1, day: 10 });
  assert.deepEqual([jan.golden, jan.lunarYear, jan.leaps[0].year], [15, 1989, 1989]);
  assert.ok(r.leapCount >= 6 && r.leapCount <= 8, String(r.leapCount));
  assert.ok(r.driftHours > 1.5 && r.driftHours < 2.5);
});
