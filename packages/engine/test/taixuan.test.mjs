import { test } from "node:test";
import assert from "node:assert/strict";
import { Solar } from "lunar-javascript";
import { castTaixuan } from "../dist/index.js";

const H = 12 * 3600 * 1000;
const MIN = 60 * 1000;

// 2023 年冬至時刻 T(lunar-javascript),及 T 所在「子夜–正午」半日的起點 B。
// T 多在半日中段,故冬至後的測試時刻以 B 起算;首例仍用 T + 1 分。
const s = Solar.fromYmd(2023, 7, 1).getLunar().getJieQiTable()["DONG_ZHI"];
const T = Date.UTC(s.getYear(), s.getMonth() - 1, s.getDay(), s.getHour(), s.getMinute(), s.getSecond());
const B = Date.UTC(s.getYear(), s.getMonth() - 1, s.getDay(), s.getHour() < 12 ? 0 : 12);

function at(ms) {
  const d = new Date(ms);
  return castTaixuan({
    year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(),
    hour: d.getUTCHours(), minute: d.getUTCMinutes(), gender: "男",
  });
}

test("冬至後 1 分 → 中首一贊", () => {
  const r = at(T + MIN);
  assert.equal(r.halfDayIndex, 0);
  assert.equal(r.head, 1);
  assert.equal(r.zan, 1);
  assert.equal(r.headName, "中");
  assert.equal(r.extra, null);
  assert.equal(r.tier, "classical");
  assert.deepEqual(r.winterSolstice, { year: 2023, month: 12, day: 22, hour: s.getHour(), minute: s.getMinute() });
});

test("下一個半日 → 首 1 贊 2", () => {
  const r = at(B + H + MIN);
  assert.equal(r.head, 1);
  assert.equal(r.zan, 2);
});

test("第 9 個半日 → 首 2 贊 1", () => {
  const r = at(B + 9 * H + MIN);
  assert.equal(r.halfDayIndex, 9);
  assert.equal(r.head, 2);
  assert.equal(r.zan, 1);
});

test("第 729 個半日 → 踦,第 730 → 嬴", () => {
  const a = at(B + 729 * H + MIN);
  assert.equal(a.head, null);
  assert.equal(a.zan, null);
  assert.equal(a.headName, null);
  assert.equal(a.extra, "踦");
  assert.equal(at(B + 730 * H + MIN).extra, "嬴");
});

test("冬至前 1 分 → 屬上一個冬至週期", () => {
  const r = at(T - MIN);
  assert.equal(r.winterSolstice.year, 2022);
  assert.ok(r.halfDayIndex >= 729 || r.head === 81);
});

test("steps 含冬至、半日、子夜,無粵語字", () => {
  const r = at(T + MIN);
  for (const w of ["冬至", "半日", "子夜"]) assert.ok(r.steps.some((x) => x.includes(w)), w);
  assert.ok(!r.steps.some((x) => /[嘅咗喺唔嚟佢啲睇撳冇揀㗎]|而家/.test(x)));
});

test("真太陽時校正改變落點", () => {
  // 東經 135 比標準經線早約一小時:11:30 校正後越過正午,半日序加一
  const base = { year: 2024, month: 1, day: 10, hour: 11, minute: 30, gender: "男" };
  const a = castTaixuan(base);
  const b = castTaixuan({ ...base, longitude: 135 });
  assert.equal(b.halfDayIndex, a.halfDayIndex + 1);
});
