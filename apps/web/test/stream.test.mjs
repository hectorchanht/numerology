import { test } from "node:test";
import assert from "node:assert/strict";
import { streamToPrimedResponse } from "../test-dist/stream.js";
import { classifyError } from "../test-dist/http.js";

// —— Bug 3:首 token 前失败必须抛给调用方(不返回 Response),而不是静默截断流 ——

/** 伪造 TextMessageStream:success 时逐块吐文本;failBeforeFirst 时首块前报错。 */
function fakeStream({ failBeforeFirst = false, chunks = ["甲", "乙"], status } = {}) {
  const tls = [];
  const els = [];
  let p = null;
  const api = {
    on(ev, fn) {
      (ev === "text" ? tls : els).push(fn);
      return api;
    },
    finalMessage() {
      if (!p) {
        p = (async () => {
          if (failBeforeFirst) {
            const err = new Error("Rate limit reached");
            if (status) err.status = status;
            els.forEach((f) => f(err));
            throw err;
          }
          for (const c of chunks) {
            await new Promise((r) => setTimeout(r, 5));
            tls.forEach((f) => f(c));
          }
          return { text: chunks.join("") };
        })();
      }
      return p;
    },
    abort() {},
  };
  return api;
}

test("首 token 前失败 → 抛错(调用方可转 JSON 502),绝不返回半截 Response", async () => {
  const err = await streamToPrimedResponse(fakeStream({ failBeforeFirst: true, status: 429 })).then(
    () => null,
    (e) => e,
  );
  assert.ok(err instanceof Error, "应抛出而不是返回 Response");
  const c = classifyError(err, "ai");
  assert.equal(c.status, 502);
  assert.ok(c.message.includes("限流"));
});

test("成功时正文完整:预热消费的首块会被回放,不丢失不重复", async () => {
  const res = await streamToPrimedResponse(fakeStream({ chunks: ["甲", "乙", "丙"] }));
  assert.ok(res instanceof Response);
  assert.equal(await res.text(), "甲乙丙");
});

test("超时未收到首块 → 抛超时错误(可分类为 502)", async () => {
  const never = fakeStream({ chunks: [] });
  // chunks 为空时 finalMessage 永远不 resolve;靠超时兜底
  never.finalMessage = () => new Promise(() => {});
  const err = await streamToPrimedResponse(never, 60).then(
    () => null,
    (e) => e,
  );
  assert.ok(err instanceof Error && err.message.includes("超时"));
  assert.equal(classifyError(err, "ai").status, 502);
});
