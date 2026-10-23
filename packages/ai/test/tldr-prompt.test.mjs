import { test } from "node:test";
import assert from "node:assert/strict";
import {
  REPORT_SEGMENTS,
  FORTUNE_SEGMENTS,
  TLDR_MARKER,
  buildReportSectionPrompt,
  buildFortuneSectionPrompt,
  buildReportUserPrompt,
  buildFortuneReportPrompt,
} from "../dist/index.js";

test("TL;DR 标记为固定 ASCII(三地共用,前端据此切摘要)", () => {
  assert.equal(TLDR_MARKER, "TL;DR");
});

test("13 节分段指令都要求小标题后第一行输出 TL;DR(三地)", () => {
  for (const loc of ["zht", "zhs", "en"]) {
    for (const seg of REPORT_SEGMENTS) {
      const p = buildReportSectionPrompt([], seg, "both", loc);
      assert.ok(p.includes(`${TLDR_MARKER}:`), `report/${seg.key}/${loc} 缺 TL;DR 指令`);
    }
    for (const seg of FORTUNE_SEGMENTS) {
      const p = buildFortuneSectionPrompt([], seg, "both", loc);
      assert.ok(p.includes(`${TLDR_MARKER}:`), `fortune/${seg.key}/${loc} 缺 TL;DR 指令`);
    }
  }
});

test("整篇模式(CLI)同样要求每节 TL;DR", () => {
  assert.ok(buildReportUserPrompt([], "zht").includes("TL;DR"));
  assert.ok(buildFortuneReportPrompt([], "en").includes("TL;DR"));
});
