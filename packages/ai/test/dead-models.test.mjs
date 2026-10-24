import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

// —— 动态下架登记:404 即写入 KV,列表拉取时滤走,30 天后过期复活。

function memKV() {
  const store = new Map();
  return {
    store,
    get: async (k) => (store.has(k) ? store.get(k) : null),
    put: async (k, v) => store.set(k, v),
  };
}

test("deadModels:登记/读取/归一化(models/ 前缀)/TTL 过期", async () => {
  const { recordDeadModel, readDeadModels, deadModelIds, DEAD_MODELS_KV_KEY } = await import(
    "../dist/deadModels.js"
  );
  const kv = memKV();
  await recordDeadModel(kv, "gemini", "models/gemini-2.5-flash");
  await recordDeadModel(kv, "openrouter", "dead/model:free");
  const map = await readDeadModels(kv);
  assert.equal(typeof map.gemini["gemini-2.5-flash"], "number");
  assert.equal(map.openrouter["dead/model:free"] > 0, true);
  assert.equal(kv.store.has(DEAD_MODELS_KV_KEY), true);
  // 未过期 → 在集合里;31 天后 → 过期复活。
  assert.equal(deadModelIds(map, "gemini").has("gemini-2.5-flash"), true);
  assert.equal(deadModelIds(map, "gemini", Date.now() + 31 * 24 * 60 * 60 * 1000).size, 0);
  // 无效 kv 绝不抛错。
  await recordDeadModel(null, "gemini", "x");
  await recordDeadModel({}, "gemini", "x");
  assert.deepEqual(await readDeadModels(null), {});
});

test("deadModels:显式指定模型 404 → 抛真实错误且已登记;默认模型 404 → 回落后亦登记", async () => {
  const { chatComplete } = await import("../dist/provider.js");
  const { DEAD_MODELS_KV_KEY } = await import("../dist/deadModels.js");
  const DEAD = "dead-model-x";
  const LIVE = "live-model-y";
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      if (req.url === "/models") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ data: [{ id: LIVE }] }));
        return;
      }
      const parsed = JSON.parse(body || "{}");
      if (parsed.model === DEAD || parsed.model === "google/gemma-4-26b-a4b-it:free") {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: { message: `The model ${parsed.model} does not exist`, code: 404 } }));
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ choices: [{ message: { content: "ok" } }], usage: {} }));
    });
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  const baseURL = `http://127.0.0.1:${port}`;
  try {
    // 显式指定 → 抛错且登记。
    const kv1 = memKV();
    await assert.rejects(
      chatComplete(
        { kind: "chat", maxTokens: 10, system: [], messages: [{ role: "user", content: "hi" }] },
        { provider: "openrouter", apiKey: "t", baseURL, model: DEAD, aiBinding: { kv: kv1 } },
      ),
      /does not exist/,
    );
    const m1 = JSON.parse(kv1.store.get(DEAD_MODELS_KV_KEY));
    assert.equal(typeof m1.openrouter[DEAD], "number");
    // 默认模型下架(非显式) → 回落成功且登记:用 openrouter 自身默认模型作 dead。
    const kv2 = memKV();
    const res = await chatComplete(
      { kind: "chat", maxTokens: 10, system: [], messages: [{ role: "user", content: "hi" }] },
      { provider: "openrouter", apiKey: "t", baseURL, aiBinding: { kv: kv2 } },
    );
    assert.equal(res.text, "ok");
    const m2 = JSON.parse(kv2.store.get(DEAD_MODELS_KV_KEY));
    assert.equal(typeof m2.openrouter["google/gemma-4-26b-a4b-it:free"], "number");
  } finally {
    server.close();
  }
});
