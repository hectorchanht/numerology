import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

// —— 动态模型回落:默认模型被下架(404) → 拉实时 /models 取首个重试;
//    显式指定的模型 404 → 直接抛真实错误,不回落。

const DEAD_DEFAULT = "google/gemma-4-26b-a4b-it:free"; // openrouter chat 默认模型
const LIVE_MODEL = "live-model-1";

function startMock() {
  const seen = { completions: [], models: 0 };
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      if (req.url === "/models" && req.method === "GET") {
        seen.models++;
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ data: [{ id: LIVE_MODEL }, { id: "live-model-2" }] }));
        return;
      }
      if (req.url === "/chat/completions" && req.method === "POST") {
        const parsed = JSON.parse(body || "{}");
        seen.completions.push(parsed.model);
        if (parsed.model === DEAD_DEFAULT) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: {
                message: `This model ${DEAD_DEFAULT} is no longer available. Please update your code to use ${LIVE_MODEL}.`,
                type: "invalid_request_error",
                code: 404,
              },
            }),
          );
          return;
        }
        if (parsed.stream) {
          res.writeHead(200, { "Content-Type": "text/event-stream" });
          res.end(
            `data: {"id":"1","object":"chat.completion.chunk","choices":[{"index":0,"delta":{"content":"STREAM_OK"},"finish_reason":null}]}\n\ndata: [DONE]\n\n`,
          );
          return;
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            choices: [{ message: { content: "FALLBACK_OK" } }],
            usage: { prompt_tokens: 1, completion_tokens: 1 },
          }),
        );
        return;
      }
      res.writeHead(404);
      res.end();
    });
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({ server, seen, port: server.address().port }));
  });
}

async function loadClient(baseURL, tag) {
  process.env.OPENROUTER_BASE_URL = baseURL;
  process.env.OPENROUTER_API_KEY = "test-key";
  delete process.env.AI_MODEL_REPORT;
  delete process.env.AI_MODEL_CHAT;
  // 查询串打破模块缓存:每个测试用独立的 provider 模块实例
  // (PROVIDERS 在模块加载时读取 OPENROUTER_BASE_URL,且回落缓存在模块级)
  return import(`../dist/provider.js?${tag}`);
}

const sys = [{ text: "system" }];
const msgs = [{ role: "user", content: "hi" }];

test("provider:默认模型 404 → 拉实时列表回落并成功", async () => {
  const { server, seen, port } = await startMock();
  try {
    const { chatComplete } = await loadClient(`http://127.0.0.1:${port}`, port);
    const r = await chatComplete(
      { kind: "chat", maxTokens: 50, system: sys, messages: msgs },
      { provider: "openrouter" },
    );
    assert.equal(r.text, "FALLBACK_OK");
    assert.deepEqual(seen.completions, [DEAD_DEFAULT, LIVE_MODEL]);
    assert.equal(seen.models, 1);
  } finally {
    server.close();
  }
});

test("provider:显式指定的死模型 404 → 抛真实错误,不回落", async () => {
  const { server, seen, port } = await startMock();
  try {
    const { chatComplete } = await loadClient(`http://127.0.0.1:${port}`, port);
    await assert.rejects(
      chatComplete(
        { kind: "chat", maxTokens: 50, system: sys, messages: msgs },
        { provider: "openrouter", model: DEAD_DEFAULT },
      ),
      /no longer available/,
    );
    // 只打了一次 completions,没有去拉 /models
    assert.deepEqual(seen.completions, [DEAD_DEFAULT]);
    assert.equal(seen.models, 0);
  } finally {
    server.close();
  }
});

test("provider:流式默认模型 404 → 回落后续流正常", async () => {
  const { server, seen, port } = await startMock();
  try {
    const { chatStream } = await loadClient(`http://127.0.0.1:${port}`, port);
    const stream = chatStream(
      { kind: "chat", maxTokens: 50, system: sys, messages: msgs },
      { provider: "openrouter" },
    );
    let out = "";
    stream.on("text", (d) => (out += d));
    await stream.finalMessage();
    assert.equal(out, "STREAM_OK");
    assert.deepEqual(seen.completions, [DEAD_DEFAULT, LIVE_MODEL]);
  } finally {
    server.close();
  }
});
