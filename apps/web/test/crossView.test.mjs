import { test } from "node:test";
import assert from "node:assert/strict";
import { crossRows, luoshuMarks, LUOSHU } from "../test-dist/crossView.js";
import { castChart, castCrossSystem } from "@numerology/engine";

const SAMPLE = { year: 1990, month: 3, day: 18, hour: 9, minute: 30, gender: "男" };
const r = castCrossSystem(castChart(SAMPLE));

test("crossRows:首列八字為錨點,日期基準分民用 / 真太陽時", () => {
  const rows = crossRows(r);
  assert.equal(rows[0].system, "bazi");
  assert.equal(rows[0].relation, "anchor");
  const by = Object.fromEntries(rows.map((x) => [x.system, x]));
  assert.equal(by.lifepath.dateBasis, "civil");
  assert.equal(by.ninestar.dateBasis, "solar");
  assert.equal(by.bazi.dateBasis, "solar");
  for (const x of rows.slice(1)) assert.ok(["same", "sheng", "ke"].includes(x.relation));
});

test("crossRows:無 tier 時為 unrated", () => {
  const bare = { ...r, signals: r.signals.map((s) => ({ ...s, tier: undefined })) };
  assert.ok(crossRows(bare).every((x) => x.tier === "unrated"));
  assert.equal(crossRows(r)[0].tier, "classical");
});

test("luoshuMarks:年星 1 → row 2 col 1;靈數 33 化簡為 6 → row 2 col 2", () => {
  assert.deepEqual(LUOSHU, [[4, 9, 2], [3, 5, 7], [8, 1, 6]]);
  const fake = {
    ...r,
    nineStar: { ...r.nineStar, year: { ...r.nineStar.year, number: 1 }, month: { ...r.nineStar.month, number: 5 } },
    lifePath: { ...r.lifePath, value: 33 },
  };
  const m = luoshuMarks(fake);
  assert.deepEqual(m.find((x) => x.system === "ninestar-year"), { value: 1, system: "ninestar-year", row: 2, col: 1 });
  assert.deepEqual(m.find((x) => x.system === "ninestar-month"), { value: 5, system: "ninestar-month", row: 1, col: 1 });
  assert.deepEqual(m.find((x) => x.system === "lifepath"), { value: 6, system: "lifepath", row: 2, col: 2 });
});
