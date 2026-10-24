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
