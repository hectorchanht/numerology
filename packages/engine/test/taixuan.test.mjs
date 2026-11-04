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

test("冬至前 1 分 → 屬上一個冬至週期(2022 冬至,序 730 嬴)", () => {
  const r = at(T - MIN);
  assert.equal(r.winterSolstice.year, 2022);
  assert.equal(r.halfDayIndex, 730);
  assert.equal(r.head, null);
  assert.equal(r.extra, "嬴");
});

test("序 731 確會出現:2024-12-21 17:19(冬至 17:20 前)→ 嬴", () => {
  const r = castTaixuan({ year: 2024, month: 12, day: 21, hour: 17, minute: 19, gender: "男" });
  assert.equal(r.winterSolstice.year, 2023);
  assert.equal(r.halfDayIndex, 731);
  assert.equal(r.extra, "嬴");
});

test("steps 含冬至、半日、子夜,無粵語字", () => {
  const r = at(T + MIN);
  for (const w of ["冬至", "半日", "子夜"]) assert.ok(r.steps.some((x) => x.includes(w)), w);
  assert.ok(!r.steps.some((x) => /[嘅咗喺唔嚟佢啲睇撳冇揀㗎]|而家/.test(x)));
});

test("有經度時冬至同換真太陽時:東經 135,2023 冬至約 12:28,起點改取正午", () => {
  // 東經 135 當日校正 +61 分(經度 +60、均時差 +1):鐘面 11:08 → 真太陽時 12:09,早於冬至 → 上一週期
  const before = castTaixuan({ year: 2023, month: 12, day: 22, hour: 11, minute: 8, gender: "男", longitude: 135 });
  assert.equal(before.winterSolstice.year, 2022);
  // 鐘面 11:38 → 真太陽時 12:39,已過冬至,冬至落在正午後半日 → 首 1 贊 1
  const after = castTaixuan({ year: 2023, month: 12, day: 22, hour: 11, minute: 38, gender: "男", longitude: 135 });
  assert.deepEqual(after.winterSolstice, { year: 2023, month: 12, day: 22, hour: 12, minute: 28 });
  assert.equal(after.halfDayIndex, 0);
  assert.equal(after.head, 1);
  assert.equal(after.zan, 1);
  assert.ok(after.steps.some((x) => x.includes("真太陽時")));
});

test("真太陽時跨子夜:東經 90,鐘面 2024-01-11 00:30 退回 1 月 10 日晚,半日序少一", () => {
  const base = { year: 2024, month: 1, day: 11, hour: 0, minute: 30, gender: "男" };
  const clock = castTaixuan(base);
  const solar = castTaixuan({ ...base, longitude: 90 });
  assert.equal(clock.halfDayIndex, 40);
  assert.equal(solar.halfDayIndex, 39);
});
