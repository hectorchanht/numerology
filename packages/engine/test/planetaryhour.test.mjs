import { test } from "node:test";
import assert from "node:assert/strict";
import { castPlanetaryHour } from "../dist/index.js";

// 2024-03-24 星期日,近春分;赤道上日出日落約 06:00 / 18:00(含折射略早遲數分)。
// 經度 120 = 標準經線,鐘面只差均時差數分。
const sun = (hour, minute = 0, latitude = 0) =>
  castPlanetaryHour({ year: 2024, month: 3, day: 24, hour, minute, gender: "男", longitude: 120, latitude });

test("無緯度 → null", () => {
  assert.equal(castPlanetaryHour({ year: 2024, month: 3, day: 24, hour: 12, gender: "男" }), null);
});

test("赤道春分:日出約 6 點,日落約 18 點", () => {
  const r = sun(12);
  assert.ok(Math.abs(r.sunrise - 6) < 0.1 && Math.abs(r.sunset - 18) < 0.1, `${r.sunrise} ${r.sunset}`);
});

test("星期日:第 1 時屬 Sun,第 8 時再屬 Sun,夜間第 1 時(第 13 時)屬 Jupiter", () => {
  const h1 = sun(6, 30), h8 = sun(13, 30), n1 = sun(18, 30);
  assert.deepEqual([h1.half, h1.hour, h1.hourPlanet, h1.hourName], ["day", 1, "Sun", "Yayn"]);
  assert.deepEqual([h8.hour, h8.hourPlanet], [8, "Sun"]);
  assert.deepEqual([n1.half, n1.hour, n1.hourPlanet, n1.hourName], ["night", 1, "Jupiter", "Beron"]);
  assert.equal(h1.dayAngel, "Michael");
});

test("日出前出生屬前一日(星期六 Saturn)嘅夜間", () => {
  const r = sun(3, 30);
  assert.equal(r.dayPlanet, "Saturn");
  assert.equal(r.half, "night");
  assert.equal(r.hour, 10); // 前晚約 18:05 起,每時約 60 分:03:30 落第 10 時
});

test("夜間最後一時接翌日第一時:星期六第 24 時嘅下一個係星期日 Sun", () => {
  const last = sun(5, 50);
  const order = ["Saturn", "Jupiter", "Mars", "Sun", "Venus", "Mercury", "Moon"];
  assert.equal(last.hour, 12);
  assert.equal(order[(order.indexOf(last.hourPlanet) + 1) % 7], "Sun");
});

test("高緯度夏至極晝:冇行星時,只有行星日", () => {
  const r = castPlanetaryHour({ year: 2024, month: 6, day: 21, hour: 12, gender: "男", longitude: 120, latitude: 80 });
  assert.equal(r.hour, null);
  assert.equal(r.sunrise, null);
  assert.equal(r.dayPlanet, "Venus");
});

test("Arbatel 奧林匹亞靈按行星對應", () => {
  const r = castPlanetaryHour({ year: 2024, month: 1, day: 6, hour: 12, gender: "男", latitude: 22.3, longitude: 114.2 });
  assert.equal(r.dayPlanet, "Saturn");
  assert.equal(r.dayOlympic, "Aratron");
  const map = { Saturn: "Aratron", Jupiter: "Bethor", Mars: "Phaleg", Sun: "Och", Venus: "Hagith", Mercury: "Ophiel", Moon: "Phul" };
  assert.equal(r.hourOlympic, map[r.hourPlanet]);
});
