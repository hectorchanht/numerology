import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeFortune } from "../dist/index.js";

// Bug 8 迴歸:引擎邊界年份(1900/2100)下 analyzeFortune 不拋錯、窗口無 off-by-one。

for (const birthYear of [1900, 2100]) {
  test(`边界出生年 ${birthYear}:yearsBack 5 / yearsAhead 8 不抛错`, () => {
    const f = analyzeFortune(
      { year: birthYear, month: 6, day: 15, hour: 12, minute: 0, gender: "男" },
      { referenceYear: birthYear, yearsBack: 5, yearsAhead: 8 },
    );
    assert.ok(f.bazi.daYun.length > 0, "大运应非空");
    // 紫微流年窗口:從出生年起覆蓋到參考年 +8(窗口起點早於出生年時按出生年截斷)。
    const zy = f.ziwei.yearly.map((y) => y.year);
    assert.equal(zy[0], birthYear);
    assert.equal(zy[zy.length - 1], birthYear + 8);
    assert.equal(zy.length, 9);
    // 大限四化結構完整。
    assert.equal(f.ziwei.decadal.sihua.length, 4);
  });
}

test("参考年超出出生后范围(2100 出生/ref 2110)与出生前(ref 1890)均不抛错", () => {
  const future = analyzeFortune(
    { year: 2100, month: 6, day: 15, hour: 12, minute: 0, gender: "女" },
    { referenceYear: 2110, yearsBack: 5, yearsAhead: 8 },
  );
  assert.equal(future.ziwei.yearly.length, 14); // 2105..2118
  assert.equal(future.ziwei.yearly[0].year, 2105);
  assert.equal(future.ziwei.yearly[13].year, 2118);

  const past = analyzeFortune(
    { year: 1900, month: 6, day: 15, hour: 12, minute: 0, gender: "男" },
    { referenceYear: 1890, yearsBack: 5, yearsAhead: 8 },
  );
  assert.equal(past.ziwei.yearly.length, 0, "参考窗口整体早于出生年 → 无流年");
});
