import { test } from "node:test";
import assert from "node:assert/strict";
import { applyCustomPrompt } from "../dist/index.js";

// —— B. 自定义人设:追加为 system 末块 ——
test("applyCustomPrompt:非空人设追加为最后一块(语言指令之后)", () => {
  const sys = [{ text: "persona" }, { text: "语言指令:輸出語言…" }];
  const out = applyCustomPrompt(sys, { customSystemPrompt: "  你是一只猫  " });
  assert.equal(out.length, 3);
  assert.equal(out[2].text, "你是一只猫");
  assert.equal(out[1].text, "语言指令:輸出語言…");
  // 不污染原数组
  assert.equal(sys.length, 2);
});

test("applyCustomPrompt:空/空白/缺省 → 原样返回", () => {
  const sys = [{ text: "a" }];
  assert.deepEqual(applyCustomPrompt(sys, {}), sys);
  assert.deepEqual(applyCustomPrompt(sys, { customSystemPrompt: "   " }), sys);
  assert.deepEqual(applyCustomPrompt(sys), sys);
  assert.deepEqual(applyCustomPrompt(sys, { customSystemPrompt: "" }), sys);
});
