import { test } from "node:test";
import assert from "node:assert/strict";
import { castChart, castCrossSystem } from "@numerology/engine";
import { SCIENCE_NOTES } from "@numerology/knowledge";
import {
  SYSTEM_PERSONA,
  REPORT_SEGMENTS,
  SEGMENT_TITLES,
  buildReportSectionPrompt,
  buildCachedSystem,
  crossSystemFacts,
} from "../dist/index.js";

const chart = castChart({ year: 1990, month: 3, day: 18, hour: 14, minute: 0, gender: "男" });
const cross = castCrossSystem(chart);
const facts = crossSystemFacts(cross, "zht");
const seg = REPORT_SEGMENTS.find((s) => s.key === "crosssystem");
const HEAD = "# 多體系事實(";

test("crosssystem 節:三語標題,位於 advice 之前", () => {
  const t = SEGMENT_TITLES.crosssystem;
  assert.ok(t?.zht && t?.zhs && t?.en);
  const keys = REPORT_SEGMENTS.map((s) => s.key);
  assert.ok(seg, "REPORT_SEGMENTS 應含 crosssystem");
  assert.equal(keys.indexOf("crosssystem"), keys.indexOf("advice") - 1);
});

test("crossSystemFacts:各體系值、五行、橋接、幻方數與科學條目", () => {
  assert.ok(facts.includes(HEAD));
  for (const s of cross.signals) {
    assert.ok(facts.includes(s.value), `缺 ${s.system} 值`);
    assert.ok(facts.includes(s.cite.work), `缺 ${s.system} 出處`);
  }
  assert.ok(facts.includes("河圖"));
  assert.ok(facts.includes("15") && facts.includes("45"), "洛書行和 / 總和");
  assert.ok(facts.includes(String(cross.kamea.lineSum)) && facts.includes(String(cross.kamea.total)));
  for (const n of SCIENCE_NOTES) {
    assert.ok(facts.includes(n.id), `缺 ${n.id}`);
    assert.ok(facts.includes(n.claim.zht));
  }
  assert.ok(facts.includes("待校對"));
  assert.ok(crossSystemFacts(cross, "en").includes(SCIENCE_NOTES[0].claim.en));
});

test("crosssystem prompt 含事實區塊,lens=bazi 亦不隔離", () => {
  const p = buildReportSectionPrompt([], seg, "bazi", "zht", facts);
  assert.ok(p.includes(facts), "應附事實區塊");
  assert.ok(!p.includes("只用八字"), "多體系一節不受 lens 隔離");
  assert.ok(p.includes("## " + SEGMENT_TITLES.crosssystem.zht));
});

test("crosssystem prompt 條款:只引事實區塊、基率、河圖橋接、666 中性", () => {
  const p = buildReportSectionPrompt([], seg, "both", "zht", facts);
  for (const must of ["只取自", "science-notes", "基率", "經河圖橋接", "666", "中性", "不重畫表格"]) {
    assert.ok(p.includes(must), `缺條款: ${must}`);
  }
  assert.ok(p.includes("同五行的機會約五分之一"), "同五行基率");
  assert.ok(p.includes("含相生在內的「同向」約五分之三"), "同向基率");
});

test("crosssystem 缺 extraFacts 時報錯", () => {
  assert.throws(() => buildReportSectionPrompt([], seg, "both", "zht"), /extraFacts/);
  assert.throws(() => buildReportSectionPrompt([], seg, "both", "zht", "  "), /extraFacts/);
});

test("人設限定:無多體系事實區塊時不提、不自行推算", () => {
  assert.ok(SYSTEM_PERSONA.includes("只在隨附「多體系事實」區塊時才對照"));
  assert.ok(SYSTEM_PERSONA.includes("沒有該區塊時一律不提、不自行推算"));
});

test("其他節與 buildCachedSystem 不含多體系區塊", () => {
  const other = REPORT_SEGMENTS.find((s) => s.key === "personality");
  assert.ok(!buildReportSectionPrompt([], other, "both", "zht").includes(HEAD));
  const sys = buildCachedSystem(chart, undefined, "zht").map((b) => b.text).join("\n");
  assert.ok(!sys.includes(HEAD));
  assert.ok(!sys.includes("science-notes"));
});

test("crosssystem 指令:幻方落點只稱巧合或象徵,不下統計結論", () => {
  const p = buildReportSectionPrompt([], seg, "both", "zht", facts);
  assert.ok(p.includes("巧合或象徵"));
  assert.ok(p.includes("不得宣稱「非隨機」"));
});

test("非 crosssystem 節不含多體系事實區塊", () => {
  const personality = REPORT_SEGMENTS.find((s) => s.key === "personality");
  const p = buildReportSectionPrompt([], personality, "both", "zht");
  assert.ok(!p.includes(HEAD));
});
