import { test } from "node:test";
import assert from "node:assert/strict";
import { tossCoins, castYijing, divine } from "../dist/index.js";

test("全少陽(7×6) → 乾 #1;全少陰(8×6) → 坤 #2", () => {
  assert.equal(castYijing([7, 7, 7, 7, 7, 7]).hexagram, 1);
  assert.equal(castYijing([8, 8, 8, 8, 8, 8]).hexagram, 2);
});

test("陽陰陰陰陽陰 → 屯 #3(坎上震下)", () => {
  const r = castYijing([7, 8, 8, 8, 7, 8]);
  assert.equal(r.hexagram, 3);
  assert.deepEqual(r.changing, []);
  assert.equal(r.changed, null);
});

test("動爻翻轉:乾初爻老陽 → 變卦為姤 #44", () => {
  const r = castYijing([9, 7, 7, 7, 7, 7]);
  assert.equal(r.hexagram, 1);
  assert.deepEqual(r.changing, [1]);
  // 初爻翻轉:下卦 111→011=巽,上卦仍乾 → (乾上巽下)=姤 #44
  assert.equal(r.changed, 44);
});

test("多動爻:1,6 爻動 → 變卦正確", () => {
  // 本卦 乾(111111),1/6 爻動 → 011110 = 上巽下兌 → 隨? 驗算:(上巽,下兌)=18 噬? 查表 ("巽","兌") 不在表,應為 ("兌","巽")=28 大過
  const r = castYijing([9, 7, 7, 7, 7, 9]);
  assert.deepEqual(r.changing, [1, 6]);
  // bits 反轉後:0,1,1,1,1,0 → 下兌(110)上巽(011) → 大過 #28
  assert.equal(r.changed, 28);
});

test("互卦/錯卦/綜卦:屯 #3 → 互剝? 錯/綜驗算", () => {
  const r = castYijing([7, 8, 8, 8, 7, 8]); // 屯 bits(由下) 1,0,0,0,1,0
  // 互卦:下=0,0,0=坤,上=0,0,1=艮 → (艮上坤下)=剝 #23
  assert.equal(r.hu, 23);
  // 錯卦:全反 0,1,1,1,0,1 → 下巽(011)上離(101) → (離上巽下)=鼎 #50
  assert.equal(r.cuo, 50);
  // 綜卦:倒置 0,1,0,0,0,1 → 下坎(010)上艮(001) → (艮上坎下)=蒙 #4
  assert.equal(r.zong, 4);
});

test("乾的互/錯/綜:互乾#1、錯坤#2、綜乾#1", () => {
  const r = castYijing([7, 7, 7, 7, 7, 7]);
  assert.equal(r.hu, 1);
  assert.equal(r.cuo, 2);
  assert.equal(r.zong, 1);
});

test("0/1 輸入亦可(相容二進制)", () => {
  assert.equal(castYijing([1, 1, 1, 1, 1, 1]).hexagram, 1);
  assert.equal(castYijing([0, 0, 0, 0, 0, 0]).hexagram, 2);
});

test("非法輸入拋錯", () => {
  assert.throws(() => castYijing([7, 7, 7, 7, 7]));
  assert.throws(() => castYijing([7, 7, 7, 7, 7, 5]));
});

test("tossCoins:1000 次皆為 6/7/8/9,動爻會出現", () => {
  let sawMoving = false;
  for (let i = 0; i < 1000; i++) {
    const lines = tossCoins();
    assert.equal(lines.length, 6);
    for (const v of lines) assert.ok([6, 7, 8, 9].includes(v), `非法錢值 ${v}`);
    if (lines.some((v) => v === 6 || v === 9)) sawMoving = true;
  }
  assert.ok(sawMoving, "1000 次竟無動爻,隨機源可疑");
});

test("tossCoins 可注入確定性 rng", () => {
  const lines = tossCoins(() => 0.999); // 恆正 → 每錢 3 → 和 9
  assert.deepEqual(lines, [9, 9, 9, 9, 9, 9]);
  const lines2 = tossCoins(() => 0.0); // 恆背 → 每錢 2 → 和 6
  assert.deepEqual(lines2, [6, 6, 6, 6, 6, 6]);
});

test("divine() 一次完成:結構完整", () => {
  const r = divine(() => 0.3);
  assert.equal(r.lines.length, 6);
  assert.ok(r.hexagram >= 1 && r.hexagram <= 64);
  assert.ok(r.hu >= 1 && r.hu <= 64 && r.cuo >= 1 && r.cuo <= 64 && r.zong >= 1 && r.zong <= 64);
});
