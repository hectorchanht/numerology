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

test("crossRows:非八字缺 relation 的列不虛報印證,直接略去", () => {
  const bad = { ...r, signals: r.signals.map((s) => (s.system === "lifepath" ? { ...s, relation: undefined } : s)) };
  const rows = crossRows(bad);
  assert.ok(!rows.some((x) => x.system === "lifepath"));
  assert.equal(rows.length, r.signals.length - 1);
});

test("crossRows:每列帶 fit,八字為 anchor,其餘依引擎喜忌", () => {
  const rows = crossRows(r);
  assert.equal(rows[0].fit, "anchor");
  const bySys = Object.fromEntries(r.signals.map((s) => [s.system, s]));
  for (const x of rows.slice(1)) {
    assert.ok(["favorable", "unfavorable", "neutral"].includes(x.fit));
    assert.equal(x.fit, bySys[x.system].fit);
  }
});

test("crossRows:八字中和時非錨點列 fit 全為 neutral", () => {
  const neutral = {
    ...r,
    fuyi: { ...r.fuyi, verdict: "neutral", favorable: [], unfavorable: [] },
    signals: r.signals.map((s) => (s.system === "bazi" ? s : { ...s, fit: "favorable" })),
  };
  assert.ok(crossRows(neutral).slice(1).every((x) => x.fit === "neutral"));
});
