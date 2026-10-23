import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeFortune, castZiwei } from "../dist/index.js";

const MALE = { year: 1988, month: 11, day: 3, hour: 9, minute: 0, gender: "男" };
const FEMALE = { year: 1988, month: 11, day: 3, hour: 9, minute: 0, gender: "女" };

test("每步大运都有同期大限,结构完整(禄权科忌各一)", () => {
  const f = analyzeFortune(MALE, { referenceYear: 2026, yearsAhead: 8 });
  assert.ok(f.bazi.daYun.length >= 8);
  for (const d of f.bazi.daYun) {
    const z = d.ziweiDecadal;
    assert.ok(z, `${d.ganZhi} 缺少 ziweiDecadal`);
    assert.equal(z.scope, "大限");
    assert.ok(z.heavenlyStem.length === 1 && z.earthlyBranch.length === 1, "大限干支非空");
    assert.ok(z.palaceName && z.palaceName !== "未知", "大限行宫有效");
    assert.equal(z.sihua.length, 4);
    assert.deepEqual(z.sihua.map((s) => s.type).sort(), ["权", "科", "忌", "禄"].sort());
  }
});

test("同期大限与命宫大限区间独立交叉验证(中点年龄落入宫位大限区间)", () => {
  // 用 castZiwei 的宫位 decadal.range 做独立验证,不依赖 horoscope 实现本身
  const f = analyzeFortune(MALE, { referenceYear: 2026, yearsAhead: 8 });
  const zw = castZiwei(MALE);
  for (const d of f.bazi.daYun) {
    const midAge = Math.round((d.startAge + d.endAge) / 2);
    const pal = zw.palaces.find(
      (p) => midAge >= p.decadal.range[0] && midAge <= p.decadal.range[1],
    );
    assert.ok(pal, `${d.ganZhi} 中点年龄 ${midAge} 找不到对应大限宫`);
    assert.equal(d.ziweiDecadal.heavenlyStem, pal.decadal.heavenlyStem, `${d.ganZhi} 大限天干不符`);
    assert.equal(d.ziweiDecadal.earthlyBranch, pal.decadal.earthlyBranch, `${d.ganZhi} 大限地支不符`);
  }
});

test("各步同期大限不全相同(不是把当前大限复制到每一步)", () => {
  const f = analyzeFortune(MALE, { referenceYear: 2026, yearsAhead: 8 });
  const keys = new Set(f.bazi.daYun.map((d) => d.ziweiDecadal.heavenlyStem + d.ziweiDecadal.earthlyBranch));
  assert.ok(keys.size > 1, "所有大运步的大限干支完全相同,疑似复制当前大限");
});

test("男女大运方向不同,同期大限各自有效", () => {
  const fm = analyzeFortune(MALE, { referenceYear: 2026, yearsAhead: 8 });
  const ff = analyzeFortune(FEMALE, { referenceYear: 2026, yearsAhead: 8 });
  assert.notDeepEqual(
    fm.bazi.daYun.map((d) => d.ganZhi),
    ff.bazi.daYun.map((d) => d.ganZhi),
    "男女大运应为顺/逆行不同序列",
  );
  for (const f of [fm, ff]) {
    for (const d of f.bazi.daYun) {
      assert.ok(d.ziweiDecadal.palaceName !== "未知", `${d.ganZhi} 大限行宫无效`);
      assert.equal(d.ziweiDecadal.sihua.length, 4);
    }
  }
});

test("边界:首步大运(起点年龄小于首个大限区间)不回绕到末个大限", () => {
  // 1988-11-03 男首步 3-12 岁;iztro horoscope 在起点年会回绕到 75-84 区间的大限,
  // 中点法应给出首个大限(与命宫 5-14 区间一致)
  const f = analyzeFortune(MALE, { referenceYear: 2026, yearsAhead: 8 });
  const first = f.bazi.daYun[0];
  const zw = castZiwei(MALE);
  const firstPal = zw.palaces.reduce((a, b) => (a.decadal.range[0] < b.decadal.range[0] ? a : b));
  assert.equal(first.ziweiDecadal.heavenlyStem, firstPal.decadal.heavenlyStem, "首步大限应为首个大限");
  assert.equal(first.ziweiDecadal.earthlyBranch, firstPal.decadal.earthlyBranch, "首步大限应为首个大限");
});
