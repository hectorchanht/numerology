import { test } from "node:test";
import assert from "node:assert/strict";
import { castChart } from "@numerology/engine";
import { localeDirective, buildCachedSystem, buildHourInferSystem } from "../dist/index.js";

const birth = { year: 1990, month: 3, day: 18, hour: 14, minute: 0, gender: "男" };
const chart = castChart(birth);

test("localeDirective:三地指令各异且默认繁体", () => {
  assert.ok(localeDirective("zht").includes("繁體中文"));
  assert.ok(localeDirective("zhs").includes("简体中文"));
  assert.ok(localeDirective("en").includes("English"));
});

test("buildCachedSystem:默认 zht,第三块为语言指令,不碰命盘事实块", () => {
  const sys = buildCachedSystem(chart);
  assert.equal(sys.length, 3);
  assert.ok(sys[2].text.includes("繁體中文"));
  // 命盘事实块(第二块)不受语言影响
  const sysEn = buildCachedSystem(chart, undefined, "en");
  assert.equal(sysEn[1].text, sys[1].text);
  assert.ok(sysEn[2].text.includes("English"));
});

test("buildHourInferSystem:默认 zht,末块为语言指令", () => {
  const sys = buildHourInferSystem([]);
  assert.equal(sys.length, 3);
  assert.ok(sys[2].text.includes("繁體中文"));
  const sysEn = buildHourInferSystem([], "en");
  assert.ok(sysEn[2].text.includes("English"));
});
