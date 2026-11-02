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

// —— workers-ai:核验表 ——
test("models:workers-ai 返回 verified-static 核验表", async () => {
  const r = await fetchProviderModels("workers-ai");
  assert.equal(r.source, "verified-static");
  assert.ok(r.models.length >= 1);
  assert.ok(r.models.some((m) => m.id === "@cf/mistralai/mistral-small-3.1-24b-instruct"));
  assert.equal(r.models[0].id, "@cf/mistralai/mistral-small-3.1-24b-instruct");
  assert.ok(r.verifiedAt);
});

// —— OpenAI 兼容:实时代理 ——
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

// —— mac-llm 合并列表:并行拉 Ollama + MLX 两端点 ——
const OLLAMA_IDS = ["gemma3:12b", "deepseek-r1:14b", "gpt-oss:20b", "qwen3:14b", "qwen3:8b", "qwen3:30b", "qwen3:32b"];
const MLX_IDS = ["mlx-community/gpt-oss-20b-MXFP4-Q8", "mlx-community/Qwen3-14B-4bit"];
const STATIC9 = [
  "qwen3:30b", "qwen3:8b", "qwen3:14b", "qwen3:32b", "gpt-oss:20b", "deepseek-r1:14b", "gemma3:12b",
  "mlx-community/Qwen3-14B-4bit", "mlx-community/gpt-oss-20b-MXFP4-Q8",
];

/** 按 URL 分发两端点的 stub fetch(可分别指定 throw / 状态码 / 列表)。 */
function macFetch({ ollamaIds = OLLAMA_IDS, mlxIds = MLX_IDS, ollamaStatus = 200, mlxStatus = 200, ollamaThrow = false, mlxThrow = false } = {}) {
  return stubFetch(async (url) => {
    if (url.includes("ollama.hectorchan.com")) {
      if (ollamaThrow) throw new Error("ollama down");
      return jsonResponse(ollamaStatus, { data: ollamaIds.map((id) => ({ id })) });
    }
    if (url.includes("mlx.hectorchan.com")) {
      if (mlxThrow) throw new Error("mlx down");
      return jsonResponse(mlxStatus, { data: mlxIds.map((id) => ({ id })) });
    }
    throw new Error(`unexpected url ${url}`);
  });
}

test("models:mac-llm 合并两端点 live 清单(Ollama 先、MLX 后,共 9 个)", async () => {
  const r = await fetchProviderModels("mac-llm", { fetchImpl: macFetch() });
  assert.equal(r.source, "live");
  assert.equal(r.offline, undefined);
  assert.deepEqual(r.models.map((m) => m.id), [...OLLAMA_IDS, ...MLX_IDS]);
});

test("models:mac-llm 合并去重(两端同 id 只留一份)", async () => {
  const fetchImpl = macFetch({ mlxIds: ["gpt-oss:20b", "mlx-community/Qwen3-14B-4bit"] });
  const r = await fetchProviderModels("mac-llm", { fetchImpl });
  assert.equal(r.source, "live");
  assert.deepEqual(r.models.map((m) => m.id), [...OLLAMA_IDS, "mlx-community/Qwen3-14B-4bit"]);
});

test("models:mac-llm MLX 一边失败仍 live,只剩 Ollama 7 个", async () => {
  const r = await fetchProviderModels("mac-llm", { fetchImpl: macFetch({ mlxThrow: true }) });
  assert.equal(r.source, "live");
  assert.equal(r.offline, undefined);
  assert.deepEqual(r.models.map((m) => m.id), OLLAMA_IDS);
});

test("models:mac-llm Ollama 一边失败仍 live,只剩 MLX 2 个", async () => {
  const r = await fetchProviderModels("mac-llm", { fetchImpl: macFetch({ ollamaStatus: 502 }) });
  assert.equal(r.source, "live");
  assert.equal(r.offline, undefined);
  assert.deepEqual(r.models.map((m) => m.id), MLX_IDS);
});

test("models:mac-llm 两边都失败回 offline+静态合并 9 个而唔 throw", async () => {
  const r = await fetchProviderModels("mac-llm", { fetchImpl: macFetch({ ollamaThrow: true, mlxThrow: true }) });
  assert.equal(r.source, "static");
  assert.equal(r.offline, true);
  assert.deepEqual(r.models.map((m) => m.id), STATIC9);
});

test("models:mac-llm 两边 HTTP 失败回 offline+静态而唔 throw", async () => {
  const r = await fetchProviderModels("mac-llm", { fetchImpl: macFetch({ ollamaStatus: 502, mlxStatus: 502 }) });
  assert.equal(r.offline, true);
  assert.equal(r.models.length, 9);
});

test("models:其它 provider HTTP 失败仍然抛错", async () => {
  const fetchImpl = stubFetch(async () => jsonResponse(500, { error: "oops" }));
  await assert.rejects(fetchProviderModels("glm", { fetchImpl }), /HTTP 500/);
});

test("models:mac-llm 静态表为合并 9 个(次序,两处一致)", () => {
  assert.deepEqual(staticModelsFor("mac-llm"), STATIC9);
  assert.deepEqual(STATIC_MODELS["mac-llm"], STATIC9);
});

test("models:mac-mlx live 透传 mlx server 实报 model id", async () => {
  const ids = ["mlx-community/gpt-oss-20b-MXFP4-Q8", "mlx-community/Qwen3-14B-4bit"];
  const fetchImpl = stubFetch(async (url) => {
    assert.match(url, /https:\/\/mlx\.hectorchan\.com\/v1\/models/);
    return jsonResponse(200, { data: ids.map((id) => ({ id })) });
  });
  const r = await fetchProviderModels("mac-mlx", { fetchImpl });
  assert.equal(r.source, "live");
  assert.equal(r.offline, undefined);
  assert.deepEqual(r.models.map((m) => m.id), ids);
});

test("models:mac-mlx 网络失败回 offline+静态而唔 throw", async () => {
  const fetchImpl = stubFetch(async () => { throw new Error("down"); });
  const r = await fetchProviderModels("mac-mlx", { fetchImpl });
  assert.equal(r.source, "static");
  assert.equal(r.offline, true);
  assert.deepEqual(r.models.map((m) => m.id), [
    "mlx-community/Qwen3-14B-4bit",
    "mlx-community/gpt-oss-20b-MXFP4-Q8",
  ]);
});

test("models:mac-mlx HTTP 失败回 offline 而唔 throw", async () => {
  const fetchImpl = stubFetch(async () => jsonResponse(502, { error: "bad gateway" }));
  const r = await fetchProviderModels("mac-mlx", { fetchImpl });
  assert.equal(r.offline, true);
  assert.equal(r.models.length, 2);
});

test("models:mac-mlx(旧名 back-compat)静态表保留 MLX 2 个", () => {
  // providerMeta 已合并、不再有 mac-mlx 条目;models.ts 的服务端静态表保留,
  // 供 ?provider=mac-mlx 直拉时的离线回落。
  assert.deepEqual(staticModelsFor("mac-mlx"), [
    "mlx-community/Qwen3-14B-4bit",
    "mlx-community/gpt-oss-20b-MXFP4-Q8",
  ]);
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

// —— providerMeta:分组 ——
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

// —— 动态下架:KV 登记的模型在 live 列表中被滤走 ——
test("models:KV 动态登记 + hardcode seed 在 live 列表中取并集过滤", async () => {
  const { DEAD_MODELS_KV_KEY } = await import("../test-dist/models.js").catch(() => ({}));
  // DEAD_MODELS_KV_KEY 由 @numerology/ai 导出;经 test-dist 的 models.js 间接取不到时直接用字面 key。
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

// —— accessHeaders 合并进模型列表请求头 ——
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
