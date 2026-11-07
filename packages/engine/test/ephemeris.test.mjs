import { test } from "node:test";
import assert from "node:assert/strict";
import * as Astro from "astronomy-engine";
import { castEphemeris } from "../dist/index.js";

// J2000.0 = 2000-01-01 12:00 UTC = 東八區 20:00。參考值:JPL Horizons 地心黃經(QUANTITIES=31,2026-11-05 查詢)。
const j2000 = castEphemeris({ year: 2000, month: 1, day: 1, hour: 20, gender: "男", latitude: 39.9, longitude: 116.4 });
const at = (r, p) => r.planets.find((x) => x.planet === p);

test("J2000 七曜黃經對得上 Horizons(±0.01°)", () => {
  assert.equal(j2000.utc, "2000-01-01T12:00:00.000Z");
  const ref = { Sun: 280.3689, Moon: 223.3238, Mercury: 271.8893, Venus: 241.5658, Mars: 327.9633, Jupiter: 25.2531, Saturn: 40.3956 };
  for (const [p, lon] of Object.entries(ref)) assert.ok(Math.abs(at(j2000, p).longitude - lon) < 0.01, `${p} ${at(j2000, p).longitude}`);
});

test("春分時刻太陽過白羊 0°(2024-03-20 03:06 UTC)", () => {
  const sun = (minute) => at(castEphemeris({ year: 2024, month: 3, day: 20, hour: 11, minute, gender: "女" }), "Sun");
  assert.equal(sun(0).sign, "Pisces");
  assert.equal(sun(10).sign, "Aries");
});

test("尊貴:月亮天蠍落陷、木星白羊宮主 Mars、界主同三方主星", () => {
  const moon = at(j2000, "Moon");
  assert.deepEqual(moon.dignities, ["fall"]);
  assert.equal(moon.termRuler, "Mercury"); // 天蠍 13°:Mars 7、Venus 4、Mercury 8
  assert.equal(at(j2000, "Jupiter").ruler, "Mars");
  assert.equal(at(j2000, "Sun").termRuler, "Jupiter"); // 摩羯 10°:Mercury 7、Jupiter 7
  assert.equal(j2000.sect, "night");
  assert.deepEqual(at(j2000, "Sun").triplicityRulers, ["Moon"]); // 土象夜主
});

test("逆行:2000 年初土星逆行,日月永不逆行", () => {
  assert.equal(at(j2000, "Saturn").retrograde, true);
  assert.equal(at(j2000, "Sun").retrograde, false);
  assert.equal(at(j2000, "Moon").retrograde, false);
});

test("整宮相位:按宮距,月(天蠍)對土(金牛)係 opposition", () => {
  const hit = j2000.aspects.find((a) => a.a === "Moon" && a.b === "Saturn");
  assert.equal(hit.type, "opposition");
  for (const a of j2000.aspects) assert.ok(a.separation >= 0 && a.separation <= 180);
  assert.ok(!j2000.aspects.some((a) => a.a === "Sun" && a.b === "Mercury")); // 同宮唔計
});

test("月宿:月亮 223.3° ÷ 12.857° → 第 18 宿;冇經緯度唔判晝夜", () => {
  assert.equal(j2000.moonMansion.n, 18);
  const r = castEphemeris({ year: 2000, month: 1, day: 1, hour: 20, gender: "男" });
  assert.equal(r.sect, null);
  assert.equal(at(r, "Sun").triplicityRulers.length, 2);
});


// 上升點獨立驗證:將黃經點轉赤道座標,用 astronomy-engine 嘅 Horizon 計地平高度,應 ≈ 0° 而且喺東方。
const altAz = (r, lon, lat, lng) => {
  const t = Astro.MakeTime(new Date(r.utc));
  const e = Astro.e_tilt(t).tobl * Math.PI / 180, l = lon * Math.PI / 180;
  const dec = Math.asin(Math.sin(e) * Math.sin(l)) * 180 / Math.PI;
  const ra = ((Math.atan2(Math.cos(e) * Math.sin(l), Math.cos(l)) * 180 / Math.PI + 360) % 360) / 15;
  return Astro.Horizon(t, new Astro.Observer(lat, lng, 0), ra, dec);
};

test("上升點喺東方地平線、天頂喺子午線(多個地點時刻)", () => {
  for (const [y, mo, d, h, lat, lng] of [[2000, 1, 1, 20, 39.9, 116.4], [1988, 7, 15, 6, 22.3, 114.17], [2024, 12, 1, 15, -33.9, 151.2], [1975, 3, 3, 3, 60.2, 24.9]]) {
    const r = castEphemeris({ year: y, month: mo, day: d, hour: h, gender: "男", latitude: lat, longitude: lng });
    const asc = altAz(r, r.angles.ascendant, lat, lng);
    assert.ok(Math.abs(asc.altitude) < 0.05 && asc.azimuth < 180, `${y} asc alt ${asc.altitude} az ${asc.azimuth}`);
    const mc = altAz(r, r.angles.mc, lat, lng);
    const off = mc.azimuth % 180;
    assert.ok(Math.min(off, 180 - off) < 0.05, `${y} mc az ${mc.azimuth}`); // 子午線:正南或正北
  }
});

test("整宮制:上升所在宮為第 1 宮;冇經緯度就冇宮位", () => {
  const signIdx = (lon) => Math.floor(lon / 30);
  for (const p of j2000.planets) assert.equal(p.house, ((signIdx(p.longitude) - signIdx(j2000.angles.ascendant) + 12) % 12) + 1, p.planet);
  const r = castEphemeris({ year: 2000, month: 1, day: 1, hour: 20, gender: "男" });
  assert.equal(r.angles, null);
  assert.ok(r.planets.every((p) => p.house === null));
});

test("Tetrabiblos 吉凶同合時:晝生時日、木、土合時,水星不判", () => {
  const r = castEphemeris({ year: 1990, month: 6, day: 15, hour: 12, gender: "男", latitude: 22.3, longitude: 114.2 });
  assert.equal(r.sect, "day");
  const by = Object.fromEntries(r.planets.map((p) => [p.planet, p]));
  assert.deepEqual(["Sun", "Jupiter", "Saturn"].map((p) => by[p].inSect), [true, true, true]);
  assert.deepEqual(["Moon", "Venus", "Mars"].map((p) => by[p].inSect), [false, false, false]);
  assert.equal(by.Mercury.inSect, null);
  assert.deepEqual([by.Jupiter.nature, by.Mars.nature, by.Sun.nature], ["benefic", "malefic", "common"]);
  const n = castEphemeris({ year: 1990, month: 6, day: 15, hour: 12, gender: "男" });
  assert.ok(n.planets.every((p) => p.inSect === null));
});
