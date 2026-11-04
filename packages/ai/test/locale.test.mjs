import { test } from "node:test";
import assert from "node:assert/strict";
import { castChart } from "@numerology/engine";
import { localeDirective, buildCachedSystem, buildHourInferSystem, SYSTEM_PERSONA } from "../dist/index.js";

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
  // 命盤事實塊(第二塊)不受語言影響
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

test("文風:三地指令寫明通俗簡練,人設含基率與不製造恐懼", () => {
  const zht = localeDirective("zht");
  assert.ok(zht.includes("通俗簡練"));
  assert.ok(!zht.includes("香港用語"));
  for (const ch of ["嘅", "咗", "喺", "唔", "嚟", "佢", "啲"]) assert.ok(zht.includes(ch), `zht 指令須列出禁用字 ${ch}`);
  assert.ok(localeDirective("zhs").includes("通俗简练"));
  const en = localeDirective("en");
  assert.ok(en.includes("plain") && en.includes("concise"));
  assert.ok(SYSTEM_PERSONA.includes("基率"));
  assert.ok(SYSTEM_PERSONA.includes("不製造恐懼") || SYSTEM_PERSONA.includes("不制造恐惧"));
  // 起源地與年代只能取自隨附事實,未附則不寫(防止模型自填未經核對的年代)
  assert.ok(SYSTEM_PERSONA.includes("起源地与年代以随附事实为准,未附则不写"));
});
