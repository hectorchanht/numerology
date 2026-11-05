import { test } from "node:test";
import assert from "node:assert/strict";
import { castChart, castEphemeris, castNumberLore, castBirthLore, classifyNumber, starLongitude } from "../dist/index.js";
import { BEHENIAN, NICOMACHUS } from "@numerology/knowledge";

const SAMPLE = { year: 1990, month: 3, day: 18, hour: 9, minute: 30, gender: "男", longitude: 114.17, latitude: 22.32 };
const SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

test("classifyNumber:Nicomachus 分類", () => {
  assert.equal(classifyNumber(1).parity, "unit");
  assert.equal(classifyNumber(1).parts, null);
  assert.deepEqual([classifyNumber(1).figurate, classifyNumber(1).cube], [[], null]);
  assert.equal(classifyNumber(8).parity, "evenTimesEven");
  assert.equal(classifyNumber(6).parity, "evenTimesOdd");
  assert.equal(classifyNumber(12).parity, "oddTimesEven");
  assert.equal(classifyNumber(7).parity, "prime");
  assert.equal(classifyNumber(9).parity, "composite");
  for (const n of NICOMACHUS.perfect.known) assert.equal(classifyNumber(n).parts, "perfect", String(n));
  assert.equal(classifyNumber(12).parts, "superabundant");
  assert.equal(classifyNumber(8).parts, "deficient");
  assert.equal(classifyNumber(27).cube, 3);
  assert.equal(classifyNumber(28).cube, null);
  // 形數:資料內各數列每一項都要反查得到
  for (const f of NICOMACHUS.figurate.items) {
    f.seq.forEach((v, i) => v === 1 || assert.ok(classifyNumber(v).figurate.some((x) => x.sides === f.sides && x.index === i + 1), `${f.name} ${v}`));
  }
  assert.deepEqual(classifyNumber(666).figurate, [{ sides: 3, index: 36 }]);
});

test("castNumberLore:1990-03-18 星期日 → Sun 方陣 111 / 666", () => {
  const r = castNumberLore(castChart(SAMPLE));
  const by = Object.fromEntries(r.items.map((i) => [i.source, i]));
  assert.equal(by.lifepath.value, 4);
  assert.equal(by.lifepath.scale.n, 4);
  assert.equal(by.lifepath.hebrew.name, "Daleth");
  assert.equal(by.lifepath.hebrew.group, "double");
  assert.equal(by.kameaLine.value, 111);
  assert.equal(by.kameaTotal.value, 666);
  assert.ok(by.kameaTotal.gematria.some((t) => t.greek === "ΣΥΗΝΗ"));
  assert.ok(by.mayaKin.value >= 1 && by.mayaKin.value <= 260);
  assert.ok(r.baseRate.p > 0 && r.baseRate.p < 0.05);
  assert.equal(r.baseRate.hits, r.items.filter((i) => i.gematria.length).length);
  assert.ok(r.steps.some((s) => s.includes("基率")));
  assert.deepEqual(r.tiers, { classes: "classical", gematria: "modern" });
});

test("starLongitude:2020 黃經與維基表相差 < 5′", () => {
  const t = new Date(Date.UTC(2020, 0, 1));
  for (const s of BEHENIAN.stars) {
    const [d, sign, m] = s.lon2020.split(" ");
    const want = SIGNS.indexOf(sign) * 30 + Number(d) + Number(m) / 60;
    const got = starLongitude(s.ra, s.dec, t);
    const diff = Math.abs(((got - want + 540) % 360) - 180);
    assert.ok(diff < 5 / 60, `${s.name}: ${got.toFixed(3)} vs ${want.toFixed(3)}`);
  }
});

test("castBirthLore:律呂、黃道、星期、恆星", () => {
  const chart = castChart(SAMPLE);
  const r = castBirthLore(chart, castEphemeris(SAMPLE));
  assert.equal(chart.bazi.fourPillars.month.zhi, "卯");
  assert.deepEqual([r.lulu.lunarMonth, r.lulu.pipe, r.lulu.value, r.lulu.group, r.lulu.season], [2, "夾鐘", 68, "upper", "仲春"]);
  assert.equal(r.zodiac.sign, "Pisces");
  assert.equal(r.zodiac.ruler, "Jupiter");
  assert.equal(r.zodiac.letter.glyph, "ק");
  assert.equal(r.dayPlanet.planet, "Sun");
  assert.equal(r.dayPlanet.letter.glyph, "ד");
  assert.equal(r.stars.lons.length, 16);
  assert.equal(r.stars.points, 9);
  assert.ok(r.stars.p > 0.2 && r.stars.p < 0.6, String(r.stars.p));
  for (const h of r.stars.hits) assert.ok(h.orb <= 6 && !h.alt);
  for (const h of r.stars.altHits) assert.equal(h.star, "Polaris");
});

test("律呂:寅月太蔟 72、子月黃鐘 81", () => {
  const sky = castEphemeris(SAMPLE);
  const feb = castChart({ ...SAMPLE, month: 2, day: 20 });
  assert.equal(castBirthLore(feb, sky).lulu.pipe, "太蔟");
  const dec = castChart({ ...SAMPLE, month: 12, day: 20 });
  const r = castBirthLore(dec, sky).lulu;
  assert.deepEqual([r.pipe, r.value, r.mode], ["黃鐘", 81, "宮"]);
});
