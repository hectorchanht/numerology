import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchProviderModels, staticModelsFor } from "../test-dist/models.js";
import { PROVIDER_META, STATIC_MODELS, FILTER_LABEL_KEYS } from "../test-dist/providerMeta.js";

function stubFetch(handler) {
  return async (url, init) => handler(url, init);
}
function jsonResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

// —— workers-ai:核驗表 ——
test("models:workers-ai 返回 verified-static 核验表", async () => {
  const r = await fetchProviderModels("workers-ai");
  assert.equal(r.source, "verified-static");
  assert.ok(r.models.length >= 1);
  assert.ok(r.models.some((m) => m.id === "@cf/mistralai/mistral-small-3.1-24b-instruct"));
  assert.equal(r.models[0].id, "@cf/mistralai/mistral-small-3.1-24b-instruct");
  assert.ok(r.verifiedAt);
});

// —— OpenAI 兼容:實時代理 ——
test("models:live 代理解析 {data:[{id}]}", async () => {
  const fetchImpl = stubFetch(async (url, init) => {
    assert.match(url, /https:\/\/x\.test\/v1\/models/);
    assert.ok(!init?.headers?.Authorization, "无 key 时不带 Authorization");
    return jsonResponse(200, { data: [{ id: "m1" }, { id: "m2" }, {}] });
  });
  const r = await fetchProviderModels("pollinations", {
    baseUrl: "https://x.test/v1/",
    fetchImpl,
  });
  assert.equal(r.source, "live");
  assert.deepEqual(r.models.map((m) => m.id), ["m1", "m2"]);
});

test("models:401 回落静态表并标记 needsKey", async () => {
  const fetchImpl = stubFetch(async () => jsonResponse(401, { error: "nope" }));
  const r = await fetchProviderModels("glm", { fetchImpl });
  assert.equal(r.needsKey, true);
  assert.ok(r.models.length > 0);
  assert.equal(r.source, "static");
});

test("models:key 经 Authorization 头发送,不进返回值", async () => {
  let seenAuth = "";
  const fetchImpl = stubFetch(async (url, init) => {
    seenAuth = init?.headers?.Authorization ?? "";
    return jsonResponse(200, { data: [{ id: "k1" }] });
  });
  const r = await fetchProviderModels("groq", { key: "sk-secret", fetchImpl });
  assert.equal(seenAuth, "Bearer sk-secret");
  assert.ok(!JSON.stringify(r).includes("sk-secret"));
});

test("models:网络异常抛错(由路由转 502)", async () => {
  const fetchImpl = stubFetch(async () => { throw new Error("boom"); });
  await assert.rejects(fetchProviderModels("glm", { fetchImpl }), /模型列表请求失败/);
});

// —— mac-llm 列表:只拉 Ollama 一個端點(MLX 已停用,無合併) ——
const OLLAMA_IDS = ["gemma3:12b", "deepseek-r1:14b", "gpt-oss:20b", "qwen3:14b", "qwen3:8b", "qwen3:30b", "qwen3:32b"];
const STATIC7 = [
  "qwen3:30b", "qwen3:8b", "qwen3:14b", "qwen3:32b", "gpt-oss:20b", "deepseek-r1:14b", "gemma3:12b",
];

/** Ollama 端點的 stub fetch;任何其它 URL(尤其 MLX)即 throw,守住「不再打 MLX」。 */
function macFetch({ ollamaIds = OLLAMA_IDS, ollamaStatus = 200, ollamaThrow = false } = {}) {
  return stubFetch(async (url) => {
    if (url.includes("ollama.hectorchan.com")) {
      if (ollamaThrow) throw new Error("ollama down");
      return jsonResponse(ollamaStatus, { data: ollamaIds.map((id) => ({ id })) });
    }
    throw new Error(`unexpected url ${url}`);
  });
}

test("models:mac-llm 只拉 Ollama 端点 live 清单(7 个,无 MLX)", async () => {
  const r = await fetchProviderModels("mac-llm", { fetchImpl: macFetch() });
  assert.equal(r.provider, "mac-llm");
  assert.equal(r.source, "live");
  assert.equal(r.offline, undefined);
  assert.deepEqual(r.models.map((m) => m.id), OLLAMA_IDS);
  assert.ok(!JSON.stringify(r).includes("mlx"), "结果不应含任何 MLX 字串");
});

test("models:mac-llm 网络失败回 offline+静态 7 个而唔 throw", async () => {
  const r = await fetchProviderModels("mac-llm", { fetchImpl: macFetch({ ollamaThrow: true }) });
  assert.equal(r.source, "static");
  assert.equal(r.offline, true);
  assert.deepEqual(r.models.map((m) => m.id), STATIC7);
});

test("models:mac-llm HTTP 失败回 offline+静态而唔 throw", async () => {
  const r = await fetchProviderModels("mac-llm", { fetchImpl: macFetch({ ollamaStatus: 502 }) });
  assert.equal(r.offline, true);
  assert.equal(r.models.length, 7);
});

test("models:其它 provider HTTP 失败仍然抛错", async () => {
  const fetchImpl = stubFetch(async () => jsonResponse(500, { error: "oops" }));
  await assert.rejects(fetchProviderModels("glm", { fetchImpl }), /HTTP 500/);
});

test("models:mac-llm 静态表为 Ollama 7 个(次序,两处一致)", () => {
  assert.deepEqual(staticModelsFor("mac-llm"), STATIC7);
  assert.deepEqual(STATIC_MODELS["mac-llm"], STATIC7);
});

test("models:mac-mlx 退役旧名正规化为 mac-llm:live 拉 Ollama 清单", async () => {
  const r = await fetchProviderModels("mac-mlx", { fetchImpl: macFetch() });
  assert.equal(r.provider, "mac-llm");
  assert.equal(r.source, "live");
  assert.equal(r.offline, undefined);
  assert.deepEqual(r.models.map((m) => m.id), OLLAMA_IDS);
});

test("models:mac-mlx 旧名失败同样回 mac-llm 的 offline+静态 7 个", async () => {
  const fetchImpl = stubFetch(async () => { throw new Error("down"); });
  const r = await fetchProviderModels("mac-mlx", { fetchImpl });
  assert.equal(r.provider, "mac-llm");
  assert.equal(r.source, "static");
  assert.equal(r.offline, true);
  assert.deepEqual(r.models.map((m) => m.id), STATIC7);
});

test("models:mac-mlx 旧名静态回落 = mac-llm 7 个(providerMeta 无独立条目)", () => {
  assert.deepEqual(staticModelsFor("mac-mlx"), STATIC7);
  assert.equal(STATIC_MODELS["mac-mlx"], undefined);
});

test("models:openrouter 标记 free 模型", async () => {
  const fetchImpl = stubFetch(async () =>
    jsonResponse(200, {
      data: [
        { id: "a:free", pricing: { prompt: "0" } },
        { id: "b:paid", pricing: { prompt: "0.1" } },
      ],
    }),
  );
  const r = await fetchProviderModels("openrouter", { fetchImpl });
  assert.deepEqual(r.models, [{ id: "a:free", free: true }, { id: "b:paid" }]);
});

test("models:anthropic/custom 走静态表", async () => {
  const r = await fetchProviderModels("anthropic");
  assert.equal(r.source, "static");
  assert.ok(r.models.length > 0);
});

// —— providerMeta:分組 ——
test("models:PROVIDER_META 分组与 ai 包一致(workers-ai 首位)", () => {
  assert.equal(PROVIDER_META[0].name, "workers-ai");
  const groups = Object.fromEntries(PROVIDER_META.map((p) => [p.name, p.group]));
  assert.equal(groups["workers-ai"], "nokey");
  assert.equal(groups["pollinations"], "nokey");
  assert.equal(groups["openrouter"], "freekey");
  assert.equal(groups["custom"], "paid");
  assert.deepEqual(Object.keys(FILTER_LABEL_KEYS).sort(), ["all", "free", "nokey", "paid", "recommended"]);
  for (const p of PROVIDER_META) {
    assert.ok((STATIC_MODELS[p.name] ?? []).length > 0 || p.name === "custom", `${p.name} 应有静态备选`);
  }
});

test("models:staticModelsFor 未知 provider 返回空数组", () => {
  assert.deepEqual(staticModelsFor("nope"), []);
});

test("models:静态回落的 :free 模型带 free:true", async () => {
  const fetchImpl = stubFetch(async () => jsonResponse(401, { error: "nope" }));
  const r = await fetchProviderModels("openrouter", { fetchImpl });
  assert.equal(r.source, "static");
  assert.ok(r.models.length > 0);
  assert.ok(r.models.every((m) => m.free === true), "openrouter 静态表应全为 :free");
});

// —— 動態下架:KV 登記的模型在 live 列表中被濾走 ——
test("models:KV 动态登记 + hardcode seed 在 live 列表中取并集过滤", async () => {
  const { DEAD_MODELS_KV_KEY } = await import("../test-dist/models.js").catch(() => ({}));
  // DEAD_MODELS_KV_KEY 由 @numerology/ai 導出;經 test-dist 的 models.js 間接取不到時直接用字面 key。
  const key = DEAD_MODELS_KV_KEY ?? "ai-dead-models:v1";
  const kv = {
    store: new Map([[key, JSON.stringify({ gemini: { "gemini-9.9-dead": Date.now() } })]]),
    get: async function (k) { return this.store.get(k) ?? null; },
  };
  const fetchImpl = stubFetch(async () =>
    jsonResponse(200, {
      data: [
        { id: "models/gemini-9.9-dead" },
        { id: "models/gemini-2.5-flash" },
        { id: "models/gemini-3.8-flash" },
      ],
    }),
  );
  const r = await fetchProviderModels("gemini", { fetchImpl, kv });
  assert.equal(r.source, "live");
  assert.deepEqual(r.models.map((m) => m.id), ["models/gemini-3.8-flash"]);
});

// —— accessHeaders 合併進模型列表請求頭 ——
test("models:accessHeaders 合并进 /models 请求头", async () => {
  let gotHeaders = null;
  const fetchImpl = stubFetch(async (url, init) => {
    gotHeaders = init?.headers ?? {};
    return jsonResponse(200, { data: [{ id: "m1" }] });
  });
  const r = await fetchProviderModels("mac-llm", {
    fetchImpl,
    accessHeaders: { "CF-Access-Client-Id": "id-x", "CF-Access-Client-Secret": "sec-x" },
  });
  assert.equal(r.source, "live");
  assert.equal(gotHeaders["CF-Access-Client-Id"], "id-x");
  assert.equal(gotHeaders["CF-Access-Client-Secret"], "sec-x");
});
