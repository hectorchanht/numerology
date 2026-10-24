import { test } from "node:test";
import assert from "node:assert/strict";
import {
  listProviders,
  providerBaseUrl,
  providerNeedsKey,
} from "../dist/client.js";
import { WORKERS_AI_MODELS, WORKERS_AI_DEFAULT_MODEL } from "../dist/workersAiModels.js";

// —— provider 分组元信息 ——
test("provider:listProviders workers-ai 排首位,分组正确", () => {
  const list = listProviders();
  assert.equal(list[0].name, "workers-ai");
  const byName = Object.fromEntries(list.map((p) => [p.name, p]));
  assert.equal(byName["workers-ai"].group, "nokey");
  assert.equal(byName["pollinations"].group, "nokey");
  for (const n of ["glm", "gemini", "groq", "openrouter"]) assert.equal(byName[n].group, "freekey");
  for (const n of ["anthropic", "custom"]) assert.equal(byName[n].group, "paid");
  assert.equal(byName["workers-ai"].needsKey, false);
  assert.equal(byName["openrouter"].needsKey, true);
});

test("provider:providerBaseUrl 只对 OpenAI 兼容 provider 返回", () => {
  assert.equal(providerBaseUrl("pollinations"), "https://text.pollinations.ai/openai");
  assert.equal(providerBaseUrl("openrouter"), "https://openrouter.ai/api/v1");
  assert.equal(providerBaseUrl("anthropic"), undefined);
  assert.equal(providerBaseUrl("workers-ai"), undefined);
  assert.equal(providerBaseUrl("nope"), undefined);
});

test("provider:providerNeedsKey 判定", () => {
  assert.equal(providerNeedsKey("workers-ai"), false);
  assert.equal(providerNeedsKey("pollinations"), false);
  assert.equal(providerNeedsKey("openrouter"), true);
  assert.equal(providerNeedsKey("custom"), true);
  assert.equal(providerNeedsKey("nope"), true);
});

// —— workers-ai 模型表 ——
test("provider:workers-ai 模型表非空,默认模型在表中", () => {
  assert.ok(WORKERS_AI_MODELS.length >= 1);
  assert.ok(WORKERS_AI_MODELS.some((m) => m.id === WORKERS_AI_DEFAULT_MODEL));
  for (const m of WORKERS_AI_MODELS) {
    assert.match(m.id, /^@cf\//, "模型 id 应为 @cf/ 开头");
    assert.ok(m.contextWindow > 0 && m.priceInPerM > 0 && m.priceOutPerM > 0);
  }
  assert.equal(WORKERS_AI_DEFAULT_MODEL, "@cf/mistralai/mistral-small-3.1-24b-instruct");
});

test("provider:实验模型不做默认(繁体稳定性待真机验证)", () => {
  const exp = WORKERS_AI_MODELS.filter((m) => m.experimental);
  assert.ok(exp.length >= 2, "应有 Sea Lion 27B 与 Llama 3.3 70B 两个实验模型");
  assert.ok(exp.some((m) => m.id === "@cf/aisingapore/gemma-sea-lion-v4-27b-it"));
  assert.ok(exp.some((m) => m.id === "@cf/meta/llama-3.3-70b-instruct-fp8-fast"));
  for (const m of exp) assert.notEqual(m.id, WORKERS_AI_DEFAULT_MODEL, "实验模型不得为默认");
});

test("provider:mac-llm 在册,走 tunnel baseURL,免 key", () => {
  const list = listProviders();
  const byName = Object.fromEntries(list.map((p) => [p.name, p]));
  assert.equal(byName["mac-llm"].group, "nokey");
  assert.equal(byName["mac-llm"].needsKey, false);
  assert.equal(providerBaseUrl("mac-llm"), "https://ollama.hectorchan.com/v1");
  assert.equal(providerNeedsKey("mac-llm"), false);
});

test("provider:mac-llm 请求带 reasoning_effort none(关思考),其它 provider 不带", async () => {
  const { chatComplete } = await import("../dist/provider.js");
  const http = await import("node:http");
  const seen = [];
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      seen.push(JSON.parse(body || "{}"));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ choices: [{ message: { content: "ok" } }], usage: {} }));
    });
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const baseURL = `http://127.0.0.1:${server.address().port}`;
  const req = { kind: "chat", maxTokens: 10, system: [], messages: [{ role: "user", content: "hi" }] };
  try {
    await chatComplete(req, { provider: "mac-llm", model: "qwen3:8b", baseURL });
    await chatComplete(req, { provider: "openrouter", apiKey: "t", model: "x", baseURL });
  } finally {
    server.close();
  }
  assert.equal(seen[0].reasoning_effort, "none");
  assert.equal("reasoning_effort" in seen[1], false);
});
