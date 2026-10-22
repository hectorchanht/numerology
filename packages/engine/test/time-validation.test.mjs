import { test } from "node:test";
import assert from "node:assert/strict";
import { validateBirthInput, daysInMonth } from "../dist/index.js";

// Bug 1 回归:validateBirthInput 必须按真实历法校验日期(月天数 + 闰年)。

test("daysInMonth:平年 2 月 28 天、闰年 29 天、大小月正确", () => {
  assert.equal(daysInMonth(2023, 2), 28);
  assert.equal(daysInMonth(2024, 2), 29);
  assert.equal(daysInMonth(2000, 2), 29); // 整百年被 400 整除是闰年
  assert.equal(daysInMonth(1900, 2), 28); // 整百年不被 400 整除不是闰年
  assert.equal(daysInMonth(2023, 4), 30);
  assert.equal(daysInMonth(2023, 1), 31);
});

test("非法日期被拒且报错信息明确:2 月 30 日、4 月 31 日、平年 2 月 29 日", () => {
  const bad = [
    { year: 2023, month: 2, day: 30 },
    { year: 2023, month: 4, day: 31 },
    { year: 2023, month: 2, day: 29 },
    { year: 1900, month: 2, day: 29 },
  ];
  for (const d of bad) {
    assert.throws(
      () => validateBirthInput({ ...d, hour: 12, minute: 0, gender: "男" }),
      /只有 \d+ 天/,
      `${d.year}-${d.month}-${d.day} 应被拒绝`,
    );
  }
});

test("合法日期通过:闰年 2 月 29 日、各月最后一天", () => {
  validateBirthInput({ year: 2024, month: 2, day: 29, hour: 12, minute: 0, gender: "男" });
  validateBirthInput({ year: 2023, month: 4, day: 30, hour: 12, minute: 0, gender: "男" });
  validateBirthInput({ year: 2000, month: 2, day: 29, hour: 12, minute: 0, gender: "女" });
  validateBirthInput({ year: 1900, month: 1, day: 31, hour: 0, minute: 0, gender: "男" });
  validateBirthInput({ year: 2100, month: 12, day: 31, hour: 23, minute: 59, gender: "女" });
});
