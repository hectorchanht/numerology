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
  assert.equal(WORKERS_AI_DEFAULT_MODEL, "@cf/meta/llama-3.1-8b-instruct-fp8");
});
