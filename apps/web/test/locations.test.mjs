import { test } from "node:test";
import assert from "node:assert/strict";
import { PROVINCES, COUNTRIES, REGIONS } from "../test-dist/locations.js";

test("locations:中國省數據完整", () => {
  assert.ok(PROVINCES.length >= 30, `provinces=${PROVINCES.length}`);
  for (const p of PROVINCES) {
    assert.ok(p.cities.length > 0, `${p.province} 無城市`);
    for (const c of p.cities) {
      assert.ok(c.longitude >= 70 && c.longitude <= 140, `${c.name} 經度異常:${c.longitude}`);
    }
  }
});

test("locations:世界國家數據完整", () => {
  assert.ok(COUNTRIES.length >= 40, `countries=${COUNTRIES.length}`);
  const continents = new Set(COUNTRIES.map((c) => c.continent));
  for (const want of ["北美洲", "欧洲", "亚洲", "大洋洲", "南美洲", "非洲"]) {
    assert.ok(continents.has(want), `缺 ${want}`);
  }
  for (const c of COUNTRIES) {
    assert.ok(c.cities.length > 0, `${c.country} 無城市`);
    for (const city of c.cities) {
      assert.ok(
        city.longitude >= -180 && city.longitude <= 180,
        `${c.country}/${city.name} 經度異常:${city.longitude}`,
      );
    }
  }
});

test("locations:REGIONS 統一結構無重名", () => {
  assert.ok(REGIONS.length === PROVINCES.length + COUNTRIES.length);
  const names = REGIONS.map((r) => r.name);
  assert.equal(new Set(names).size, names.length, "地區重名");
  // 卡加利(用戶所在地)一定要搵到
  const canada = REGIONS.find((r) => r.name === "加拿大");
  assert.ok(canada, "無加拿大");
  const calgary = canada.cities.find((c) => c.name === "卡尔加里");
  assert.ok(calgary, "無卡尔加里");
  assert.equal(calgary.longitude, -114.07);
});
