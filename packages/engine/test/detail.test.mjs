import { test } from "node:test";
import assert from "node:assert/strict";
import { changSheng, shenShaForPillar, castBazi, CHANGSHENG_STAGES } from "../dist/index.js";

test("十二长生计算正确(规则交叉验证)", () => {
  assert.equal(changSheng("庚", "戌"), "衰"); // 庚長生巳,順行至戌=衰
  assert.equal(changSheng("丁", "丑"), "墓"); // 丁長生酉,逆行至醜=墓
  assert.equal(changSheng("甲", "亥"), "长生"); // 甲陽長生在亥
  assert.equal(changSheng("乙", "午"), "长生"); // 乙陰長生在午
});

test("神煞标准规则:天乙/驿马/将星/桃花/华盖", () => {
  // 日干庚 → 天乙貴人在醜、未
  assert.ok(shenShaForPillar({ dayGan: "庚", monthZhi: "子", yearZhi: "丑", dayZhi: "戌" }, "甲", "丑").includes("天乙贵人"));
  // 年支申(申子辰局)→ 驛馬在寅、將星在子、桃花在酉、華蓋在辰
  const ctx = { dayGan: "庚", monthZhi: "子", yearZhi: "申", dayZhi: "子" };
  assert.ok(shenShaForPillar(ctx, "甲", "寅").includes("驿马"));
  assert.ok(shenShaForPillar(ctx, "甲", "子").includes("将星"));
  assert.ok(shenShaForPillar(ctx, "甲", "酉").includes("桃花"));
  assert.ok(shenShaForPillar(ctx, "甲", "辰").includes("华盖"));
});

test("castBazi 填充星运/自坐/空亡/神煞(结构有效)", () => {
  const b = castBazi({ year: 1990, month: 3, day: 18, hour: 9, minute: 30, gender: "男" });
  const day = b.fourPillars.day;
  assert.ok(CHANGSHENG_STAGES.includes(day.xingYun), "星运应为十二长生之一");
  assert.ok(CHANGSHENG_STAGES.includes(day.ziZuo), "自坐应为十二长生之一");
  assert.equal(day.xunKong.length, 2, "空亡应为两字");
  for (const p of [b.fourPillars.year, b.fourPillars.month, b.fourPillars.day, b.fourPillars.hour]) {
    assert.ok(Array.isArray(p.shenSha));
  }
});

test("castBazi 胎元胎息命宮身宮 + 原局關係", () => {
  const c = castBazi({ year: 1990, month: 5, day: 15, hour: 14, minute: 30, gender: "男" });
  assert.deepEqual(c.extraPalaces.taiYuan, { ganZhi: "壬申", naYin: "剑锋金" });
  assert.equal(c.extraPalaces.taiXi.ganZhi, "乙酉");
  assert.equal(c.extraPalaces.mingGong.ganZhi, "辛巳");
  assert.equal(c.extraPalaces.shenGong.ganZhi, "己丑");
  assert.equal(c.relations.length, 2);
});
