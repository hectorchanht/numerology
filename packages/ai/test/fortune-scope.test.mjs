import { test} from "node:test";
import assert from "node:assert/strict";
import { castChart, analyzeFortune} from "@numerology/engine";
import { buildContextPack, buildCachedSystem} from "../dist/index.js";

const birth = { year: 1990, month: 3, day: 18, hour: 14, minute: 0, gender: "男"};
const chart = castChart(birth);
const fortune = analyzeFortune(birth, { referenceYear: 2026, yearsBack: 5, yearsAhead: 8});

const dynOf = (scope) => {
const { markdown} = buildContextPack(chart, fortune, { fortuneScope: scope});
const i = markdown.indexOf("## 动态运势");
return i >= 0? markdown.slice(i): "";
};

test("默认 scope=full:保持旧行为(含大运/流年/大限/流年四化)", () => {
const dyn = dynOf("full");
for (const must of ["八字大运", "八字流年", "紫微大限四化", "紫微流年四化"]) {
assert.ok(dyn.includes(must), `full 缺少: ${must}`);
}
// 不传 opts 时默认也是 full
const { markdown} = buildContextPack(chart, fortune);
assert.ok(markdown.includes("紫微流年四化"), "默认应为 full");
});

test("scope=none:无动态段", () => {
const { markdown} = buildContextPack(chart, fortune, { fortuneScope: "none"});
assert.ok(!markdown.includes("## 动态运势"), "none 不应有动态段");
assert.ok(markdown.includes("八字四柱"), "静态命盘仍在");
});

test("scope=current:只有当前运两行,无逐年", () => {
const dyn = dynOf("current");
assert.ok(dyn.includes("当前八字大运"), "应有当前大运行");
assert.ok(dyn.includes("当前紫微大限"), "应有当前大限行");
assert.ok(!dyn.includes("### 八字流年"), "current 不应有流年节");
assert.ok(!dyn.includes("### 八字大运"), "current 不应有逐运节");
assert.ok(dyn.length < 600, `current 应紧凑,实际 ${dyn.length}`);
});

test("scope=dayun:有逐运+信号digest,无流年", () => {
const dyn = dynOf("dayun");
assert.ok(dyn.includes("### 八字大运"), "应有逐运节");
assert.ok(dyn.includes("确定性信号"), "应有信号 digest");
assert.ok(!dyn.includes("### 八字流年"), "dayun 不应有流年节");
assert.ok(!dyn.includes("### 紫微流年四化"), "dayun 不应有流年四化节");
// digest 内容来自确定性数据
const yongSteps = fortune.bazi.daYun.filter((d) => d.suppliesUseGod).map((d) => d.ganZhi);
for (const gz of yongSteps.slice(0, 2)) {
assert.ok(dyn.includes(gz), `digest 应列出引动用神步 ${gz}`);
}
});

test("scope=review:只含已过年,不含未来年", () => {
const dyn = dynOf("review");
assert.ok(dyn.includes("已过"), "应有已过标记");
assert.ok(dyn.includes("年份所属大运"), "应有年份→大运映射");
const futureYears = fortune.bazi.liuNian.filter((y) =>!y.isPast).map((y) => String(y.year));
for (const yr of futureYears) {
assert.ok(!dyn.includes(`${yr}(`), `review 不应含未来年 ${yr}`);
}
assert.ok(!dyn.includes("### 八字大运"), "review 不应有逐运节");
});

test("scope=future:只含参考年/未来年,不含已过年", () => {
const dyn = dynOf("future");
const pastYears = fortune.bazi.liuNian.filter((y) => y.isPast).map((y) => String(y.year));
for (const yr of pastYears) {
assert.ok(!dyn.includes(`${yr}(`), `future 不应含已过年 ${yr}`);
}
assert.ok(dyn.includes("") || dyn.includes("2026("), "应含参考年");
});

test("各 scope 体积严格递减:full > dayun > current", () => {
const len = (s) => dynOf(s).length;
assert.ok(len("full") > len("dayun"), `full(${len("full")}) > dayun(${len("dayun")})`);
assert.ok(len("dayun") > len("current"), `dayun(${len("dayun")}) > current(${len("current")})`);
});

test("buildCachedSystem 透传 fortuneScope", () => {
const sysFull = buildCachedSystem(chart, fortune, "zht");
const sysCur = buildCachedSystem(chart, fortune, "zht", { fortuneScope: "current"});
assert.ok(sysFull[1].text.includes("紫微流年四化"), "full system 应有流年四化");
assert.ok(!sysCur[1].text.includes("紫微流年四化"), "current system 不应有流年四化");
assert.ok(sysCur[1].text.includes("当前八字大运"), "current system 应有当前运");
});

test("无 fortune 时 scope 不影响(无动态段,不报错)", () => {
const { markdown} = buildContextPack(chart, undefined, { fortuneScope: "dayun"});
assert.ok(!markdown.includes("## 动态运势"));
});
