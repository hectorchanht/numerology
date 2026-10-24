import { test } from "node:test";
import assert from "node:assert/strict";
import { castFeixing } from "../dist/index.js";

/**
 * 手工驗算:
 * 例1:八運(2010 年)子山午向(坐坎)。
 *   運盤(8入中順飛):5:8,6:9,7:1,8:2,9:3,1:4,2:5,3:6,4:7。
 *   山盤(坐坎1,坎陽順飛):5:1,6:2,7:3,8:4,9:5,1:6,2:7,3:8,4:9。
 *   向盤(向離9,離陰逆飛):5:9,6:8,7:7,8:6,9:5,1:4,2:3,3:2,4:1。
 *   離9宮:運3/山5/向5;坎1宮:運4/山6/向4。
 * 例2:九運(2026 年)卯山酉向(坐震)。
 *   運盤(9入中順飛):5:9,6:1,7:2,8:3,9:4,1:5,2:6,3:7,4:8。
 *   山盤(坐震3,震陽順飛):5:3,6:4,7:5,8:6,9:7,1:8,2:9,3:1,4:2。
 *   向盤(向兌7,兌陰逆飛):5:7,6:6,7:5,8:4,9:3,1:2,2:1,3:9,4:8。
 */

function atPalaces(input) {
  const r = castFeixing(input);
  return { r, m: Object.fromEntries(r.palaces.map((p) => [p.gong, p])) };
}

test("feixing: 八運子山午向", () => {
  const { r, m } = atPalaces({ sit: "坎", builtYear: 2010 });
  assert.equal(r.yunNum, 8);
  assert.equal(r.xiangGua, "離");
  assert.deepEqual([m[9].yun, m[9].shan, m[9].xiang], [3, 5, 5]);
  assert.deepEqual([m[1].yun, m[1].shan, m[1].xiang], [4, 6, 4]);
  assert.deepEqual([m[5].yun, m[5].shan, m[5].xiang], [8, 1, 9]);
  // 離9宮向星5退氣(非當旺)→煞宜化;坎1宮向星4平
  assert.ok(m[9].note.includes("煞宜化"), `離9宮note=${m[9].note}`);
});

test("feixing: 九運卯山酉向", () => {
  const { r, m } = atPalaces({ sit: "震", builtYear: 2026 });
  assert.equal(r.yunNum, 9);
  assert.equal(r.xiangGua, "兌");
  assert.deepEqual([m[5].yun, m[5].shan, m[5].xiang], [9, 3, 7]);
  assert.deepEqual([m[2].yun, m[2].shan, m[2].xiang], [6, 9, 1]);
  // 中宮運星9當旺;向星7在中宮,九運7死氣
  assert.equal(m[5].xiangState, "死氣");
});

test("feixing: 元運邊界", () => {
  assert.equal(castFeixing({ sit: "乾", builtYear: 2003 }).yunNum, 7);
  assert.equal(castFeixing({ sit: "乾", builtYear: 2004 }).yunNum, 8);
  assert.equal(castFeixing({ sit: "乾", builtYear: 2024 }).yunNum, 9);
  assert.equal(castFeixing({ sit: "乾", builtYear: 2044 }).yunNum, 9);
});

test("feixing: 旺衰判定(八運)", () => {
  const { m } = atPalaces({ sit: "坎", builtYear: 2010 });
  // 乾6宮向星8=當運 → 旺財;震3宮山星8=當運 → 旺丁
  assert.equal(m[6].xiangState, "當旺");
  assert.ok(m[6].note.includes("旺財"));
  assert.equal(m[3].shanState, "當旺");
  assert.ok(m[3].note.includes("旺丁"));
  // 中宮向星9=運+1 → 生氣
  assert.equal(m[5].xiangState, "生氣");
  // 離9宮向星5=死氣 → 煞宜化
  assert.equal(m[9].xiangState, "死氣");
});
