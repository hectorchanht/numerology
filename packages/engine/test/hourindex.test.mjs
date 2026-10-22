import { test } from "node:test";
import assert from "node:assert/strict";
import { castChart, hourToTimeIndex } from "../dist/index.js";
// iztro 自己的时辰索引实现(源码 lib/utils/index.js 的 timeToIndex):唯一真理来源。
import { timeToIndex } from "../../../node_modules/iztro/lib/utils/index.js";

// Bug 7 回归:hourToTimeIndex 必须与 iztro 的时辰约定完全一致(早子 00-01=0 … 亥 21-23=11、晚子 23-24=12)。

test("hourToTimeIndex 与 iztro timeToIndex:24 小时全部一致", () => {
  for (let h = 0; h < 24; h++) {
    assert.equal(hourToTimeIndex(h), timeToIndex(h), `hour=${h} 不一致`);
  }
});

test("时辰边界:00:30→早子(index 0)、23:30→晚子(index 12),时柱皆为子", () => {
  assert.equal(hourToTimeIndex(0), 0);
  assert.equal(hourToTimeIndex(23), 12);
  const early = castChart({ year: 1990, month: 6, day: 15, hour: 0, minute: 30, gender: "男" });
  const late = castChart({ year: 1990, month: 6, day: 15, hour: 23, minute: 30, gender: "男" });
  assert.ok(early.bazi.fourPillars.hour.zhi === "子", "00:30 时柱应为子");
  assert.ok(late.bazi.fourPillars.hour.zhi === "子", "23:30 时柱应为子");
  // iztro 约定:晚子时算次日(与 bazi 的 lunar-javascript 同步跨日)。
  assert.ok(early.ziwei.chineseDate !== late.ziwei.chineseDate, "早晚子应分属不同日");
});
