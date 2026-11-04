import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const F = JSON.parse(readFileSync(new URL("../data/fourth-book.json", import.meta.url), "utf8"));
const A = JSON.parse(readFileSync(new URL("../data/agrippa-correspondences.json", import.meta.url), "utf8"));

test("地占 16 圖 = 2⁴ 種點陣,冇重複", () => {
  const keys = F.geomancy.figures.map((f) => f.rows.join(""));
  assert.equal(new Set(keys).size, 16);
  for (const f of F.geomancy.figures) assert.ok(f.rows.length === 4 && f.rows.every((r) => r === 1 || r === 2), f.name);
});

test("地占:每個行星管兩圖,houseSign 係該行星廟宮", () => {
  const rulerOf = Object.fromEntries(A.zodiac.map((z) => [z.sign, z.ruler]));
  for (const f of F.geomancy.figures.filter((f) => !f.planet.endsWith("Node")))
    assert.equal(rulerOf[f.houseSign], f.planet, f.name);
  const count = {};
  for (const f of F.geomancy.figures) count[f.planet] = (count[f.planet] ?? 0) + 1;
  for (const p of ["Sun", "Moon", "Jupiter", "Venus", "Mercury", "Mars", "Saturn"]) assert.equal(count[p], 2, p);
});

test("地占三分法:每套方案 16 圖各出現一次", () => {
  const names = F.geomancy.figures.map((f) => f.name).sort();
  for (const [k, scheme] of Object.entries(F.geomancy.triplicities))
    if (typeof scheme === "object") assert.deepEqual(Object.values(scheme).flat().sort(), names, k);
});

const DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
function hourRuler(day, half, hour) {
  const { chaldeanOrder: co, days } = F.heptameron;
  const start = co.indexOf(days.find((d) => d.day === day).planet);
  return co[(start + (half === "night" ? 12 : 0) + hour - 1) % 7];
}

test("Heptameron:日主依迦勒底次序推出,原書列出嘅時辰天使全部吻合", () => {
  // 翌日第一時 = 今日第 25 時:星期次序本身就係由行星時推出
  const co = F.heptameron.chaldeanOrder;
  for (let i = 0; i < 7; i++)
    assert.equal(co[(co.indexOf(F.heptameron.days[i].planet) + 24) % 7], F.heptameron.days[(i + 1) % 7].planet, DAY[i]);
  for (const c of F.heptameron.statedCells)
    assert.equal(F.heptameron.angelOfPlanet[hourRuler(c.day, c.half, c.hour)], c.angel, `${c.day} ${c.half} ${c.hour}`);
  assert.equal(F.heptameron.hourNames.day.length, 12);
  assert.equal(F.heptameron.hourNames.night.length, 12);
});

test("Arbatel:省份每級少 7,總和 196;每人 490 年,紀年吻合", () => {
  const s = F.arbatel.spirits;
  s.forEach((x, i) => assert.equal(x.provinces, 49 - 7 * i, x.name));
  assert.equal(s.reduce((n, x) => n + x.provinces, 0), F.arbatel.totalProvinces);
  const order = ["Bethor", "Phaleg", "Och", "Hagith", "Ophiel"];
  for (const [name, end] of F.arbatel.epochs.stated)
    assert.equal(F.arbatel.epochs.firstStart + F.arbatel.yearsEach * (order.indexOf(name) + 1), end, name);
});
