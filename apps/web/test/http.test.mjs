import { test } from "node:test";
import assert from "node:assert/strict";

// —— 預算耗盡:429 + AI_BUDGET 碼,消息原樣(去掉內部標記) ——
test("http:预算耗尽 → 429 附 AI_BUDGET 码", async () => {
  const { classifyError } = await import("../test-dist/http.js");
  const r = classifyError(new Error("AI_BUDGET_EXCEEDED:本月 Workers AI 用量已達上限($2)"), "ai");
  assert.equal(r.status, 429);
  assert.equal(r.code, "AI_BUDGET");
  assert.equal(r.message, "本月 Workers AI 用量已達上限($2)");
});

// —— 模型下架錯誤碼:404 + 模型消息 → 502 且附 MODEL_NOT_FOUND ——
test("http:模型下架 404 附 MODEL_NOT_FOUND 码,其它 404 不附", async () => {
  const { classifyError } = await import("../test-dist/http.js");
  const mkErr = (status, message) => {
    const e = new Error(message);
    e.status = status;
    return e;
  };
  const dead = classifyError(mkErr(404, "404 The model gemini-2.5-flash is no longer available"), "ai");
  assert.equal(dead.status, 502);
  assert.equal(dead.code, "MODEL_NOT_FOUND");
  const other = classifyError(mkErr(404, "404 page not found"), "ai");
  assert.equal(other.status, 502);
  assert.equal(other.code, undefined);
});
