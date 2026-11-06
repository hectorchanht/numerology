import { test } from "node:test";
import assert from "node:assert/strict";
import { castZiwei, castZiweiHoroscope, computeOverlaps } from "../dist/index.js";

const S = { year: 1990, month: 5, day: 15, hour: 14, minute: 30, gender: "男" };

test("運限盤五層", () => {
  const h = castZiweiHoroscope(S, "2026-11-5");
  assert.deepEqual(h.layers.map((l) => l.label), ["大限", "小限", "流年", "流月", "流日"]);
  const [dec, age, yr, mo, dy] = h.layers;
  assert.equal(dec.heavenlyStem + dec.earthlyBranch, "己丑");
  assert.deepEqual(dec.sihua.map((s) => s.star), ["武曲", "贪狼", "天梁", "文曲"]);
  assert.equal(age.heavenlyStem + age.earthlyBranch, "庚辰");
  assert.equal(age.nominalAge, 37);
  assert.equal(yr.heavenlyStem + yr.earthlyBranch, "丙午");
  assert.deepEqual(yr.sihua.map((s) => s.star), ["天同", "天机", "文昌", "廉贞"]);
  assert.equal(mo.heavenlyStem + mo.earthlyBranch, "戊戌");
  assert.equal(dy.heavenlyStem + dy.earthlyBranch, "癸未");
  assert.ok(yr.stars.some((s) => s.name === "流禄"));
  assert.equal(yr.palaceNames.length, 12);
  assert.equal(dec.active, true);
  // 斗君值(iztro 實測):按《全書》「流年太歲宮起正月逆至本生月,又從本生月起子順數至本生時」手算核對(2026 午宮起正月逆至四月=卯,再由卯起子順數至未時=戌)
  assert.equal(h.douJun.branch, "戌");
  assert.equal(h.douJun.natalPalaceName, "命宫");
});

test("出生前日期不拋錯", () => {
  const h = castZiweiHoroscope(S, "1985-1-1");
  assert.ok(h.layers.every((l) => !l.active));
});

test("大限未起:僅大限 inactive 且不入疊化", () => {
  const h = castZiweiHoroscope(S, "1992-1-1");
  assert.deepEqual(h.layers.map((l) => l.active), [false, true, true, true, true]);
  assert.ok(h.overlaps.every((o) => o.layers.every((l) => l.layer !== "大限")));
});

test("閏月斗君同流年不變", () => {
  const a = castZiweiHoroscope(S, "2023-4-10");
  assert.equal(a.douJun.branch, castZiweiHoroscope(S, "2023-2-1").douJun.branch);
});

test("三層疊忌", () => {
  const mk = (layer) => ({ layer, sihua: [{ type: "忌", star: "廉贞", intoPalace: "命宫" }] });
  const o = computeOverlaps([mk("生年"), mk("大限"), mk("流年")]);
  assert.equal(o.length, 1);
  assert.equal(o[0].layers.length, 3);
  assert.equal(o[0].tag, "忌叠忌");
});

test("斗君:UI 以宮支對應本命宮,同 natalPalaceName 一致", () => {
  for (const g of ["男", "女"]) for (const y of [1950, 1977, 1990, 2005]) {
    const inp = { year: y, month: (y % 12) + 1, day: (y % 27) + 1, hour: y % 24, minute: 0, gender: g };
    const palaces = castZiwei(inp).palaces;
    for (const d of ["2026-1-10", "2026-6-1", "2030-12-30"]) {
      const { douJun } = castZiweiHoroscope(inp, d);
      assert.equal(palaces.find((p) => p.earthlyBranch === douJun.branch)?.name, douJun.natalPalaceName, `${y}${g} ${d}`);
    }
  }
});
