import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { NAKSHATRAS, VIMSHOTTARI, EGYPTIAN_CIVIL, FACES, FACES_ORDER, METONIC } from "../dist/index.js";
import CAL from "../dist/calendars.data.js";

const load = (f) => JSON.parse(readFileSync(new URL(`../data/${f}.json`, import.meta.url), "utf8"));

test("內聯資料與 JSON 一致", () => {
  assert.deepEqual(CAL.jyotish, load("jyotish"));
  assert.deepEqual(CAL.egyptian, load("egyptian-calendar"));
  assert.deepEqual(CAL.metonic, load("metonic"));
});

test("Vimshottari:九運共 120 年;宿主由 Aśvinī = Ketu 按運序循環", () => {
  assert.equal(NAKSHATRAS.length, 27);
  assert.equal(Object.values(VIMSHOTTARI.years).reduce((a, b) => a + b, 0), VIMSHOTTARI.total);
  NAKSHATRAS.forEach((x, i) => assert.equal(x.lord, VIMSHOTTARI.order[i % 9], x.iast));
});

test("Face:迦勒底序由白羊 0° 火星起,三十六段連續", () => {
  assert.equal(FACES.length, 12);
  FACES.flatMap((f) => f.rulers).forEach((p, i) => assert.equal(p, FACES_ORDER[i % 7], `face ${i}`));
});

test("Nabonassar 紀元:儒略曆公元前 747 年 2 月 26 日 = JDN 1448638", () => {
  // 儒略曆 → JDN(天文紀年 −746)
  const julianToJdn = (y, m, d) => {
    const a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - 32083;
  };
  assert.equal(julianToJdn(-746, 2, 26), EGYPTIAN_CIVIL.epoch.jdn);
  // Era Philip:Nabonassar 425 年 Thoth 1 = 儒略曆公元前 324 年 11 月 12 日(Almagest 年表)
  assert.equal(EGYPTIAN_CIVIL.epoch.jdn + 424 * 365, julianToJdn(-323, 11, 12));
  assert.equal(EGYPTIAN_CIVIL.months.length * EGYPTIAN_CIVIL.monthDays + EGYPTIAN_CIVIL.epagomenalDays, 365);
});

test("章蔀紀元:76 = 4 × 19、1520 = 20 × 76、4560 = 3 × 1520", () => {
  const c = METONIC.chinese;
  assert.deepEqual([c.bu / c.zhang, c.ji / c.bu, c.yuan / c.ji], [4, 20, 3]);
  assert.equal(c.zhang * 12 + c.zhangLeap, c.zhangMonths);
  assert.equal(METONIC.meton.months, 235);
});
