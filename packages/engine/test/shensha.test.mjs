import { test } from "node:test";
import assert from "node:assert/strict";
import { shenShaForPillar } from "../dist/index.js";

const ctx = (o) => ({ dayGan: "甲", monthZhi: "寅", yearZhi: "子", dayZhi: "子", ...o });

test("天德/月德/紅鸞/天喜/學堂", () => {
  assert.ok(shenShaForPillar(ctx({ monthZhi: "寅" }), "丁", "卯").includes("天德贵人"));
  assert.ok(shenShaForPillar(ctx({ monthZhi: "午" }), "丙", "卯").includes("月德贵人"));
  assert.ok(shenShaForPillar(ctx({ yearZhi: "子" }), "甲", "卯").includes("红鸾"));
  assert.ok(shenShaForPillar(ctx({ yearZhi: "子" }), "甲", "酉").includes("天喜"));
  assert.ok(shenShaForPillar(ctx({ dayGan: "庚" }), "甲", "巳").includes("学堂"));
});

test("舊神煞回歸:天乙貴人", () => {
  assert.ok(shenShaForPillar(ctx({ dayGan: "甲" }), "甲", "丑").includes("天乙贵人"));
});
