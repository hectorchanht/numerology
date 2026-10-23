import { test } from "node:test";
import assert from "node:assert/strict";
import { repairFortuneMarkdown } from "../test-dist/fortuneRepair.js";

/** 最小 FortuneAnalysis 夹具(与服务端测试同源的形状) */
const fortune = {
  referenceYear: 2026,
  bazi: {
    daYun: [
      {
        ganZhi: "甲寅", startAge: 2, endAge: 11, startYear: 1995, endYear: 2004,
        ziweiDecadal: { heavenlyStem: "丙", earthlyBranch: "辰", palaceName: "官禄" },
      },
      {
        ganZhi: "癸丑", startAge: 12, endAge: 21, startYear: 2005, endYear: 2014,
        ziweiDecadal: { heavenlyStem: "丁", earthlyBranch: "巳", palaceName: "田宅" },
      },
    ],
    liuNian: [
      { year: 2021, age: 28, ganZhi: "辛丑", isPast: true, isReference: false },
      { year: 2026, age: 33, ganZhi: "丙午", isPast: false, isReference: true },
    ],
  },
  ziwei: {
    decadal: { heavenlyStem: "戊", earthlyBranch: "午", palaceName: "福德" },
  },
};

test("客户端修复:新形状「- 歲（-）：甲寅運」", () => {
  const fixed = repairFortuneMarkdown("- 歲（-）：甲寅運", fortune, "zht");
  assert.ok(fixed.includes("### 甲寅運（2–11歲／1995–2004年）"), `实际:${fixed}`);
});

test("客户端修复:紫微大限：無 → 该步同期大限", () => {
  const md = "### 甲寅運（2–11歲／1995–2004年）\n紫微大限：無。分析：…";
  const fixed = repairFortuneMarkdown(md, fortune, "zht");
  assert.ok(fixed.includes("紫微大限：丙辰（行官禄）"), `实际:${fixed}`);
  assert.ok(!fixed.includes("紫微大限：無"));
});

test("客户端修复:流年占位 + 正文不动", () => {
  const md = "年（辛丑年）\n這步甲寅運整體還不錯。";
  const fixed = repairFortuneMarkdown(md, fortune, "zht");
  assert.ok(fixed.includes("### 2021年（辛丑，28歲）"));
  assert.ok(fixed.includes("這步甲寅運整體還不錯。"), "正文不应被改");
});

test("客户端修复:与服务端逻辑一致(spot check)", () => {
  // 同一输入应得到与服务端相同的标题行
  const md = "### 癸丑運（- 歲/-）";
  const fixed = repairFortuneMarkdown(md, fortune, "zht");
  assert.equal(fixed, "### 癸丑運（12–21歲／2005–2014年）");
});
