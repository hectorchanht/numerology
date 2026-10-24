import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PROVIDER_META,
  FILTER_LABEL_KEYS,
  COST_LABEL_KEYS,
  filterProviders,
  filterModels,
  staticModelEntries,
} from "../test-dist/providerMeta.js";
import { STRINGS, LOCALES } from "../test-dist/i18n.js";

const names = (ps) => ps.map((p) => p.name);

// —— filter chips 分组 ——
test("filter:all=9, nokey=3, free=7(免key∪免费额度), paid=2", () => {
  assert.deepEqual(names(filterProviders("all")),
    ["workers-ai", "pollinations", "mac-llm", "glm", "gemini", "groq", "openrouter", "anthropic", "custom"]);
  assert.deepEqual(names(filterProviders("nokey")), ["workers-ai", "pollinations", "mac-llm"]);
  assert.deepEqual(names(filterProviders("free")),
    ["workers-ai", "pollinations", "mac-llm", "glm", "gemini", "groq", "openrouter"]);
  assert.deepEqual(names(filterProviders("paid")), ["anthropic", "custom"]);
});

// —— 每个 provider 的短名/note/cost key 在三语中都存在 ——
test("providerMeta:shortKey/noteKey/costKey/filterKey 三语齐备", () => {
  for (const p of PROVIDER_META) {
    for (const loc of LOCALES) {
      assert.ok(STRINGS[loc][p.shortKey], `${p.name} shortKey 缺失@${loc}`);
      assert.ok(STRINGS[loc][p.noteKey], `${p.name} noteKey 缺失@${loc}`);
      assert.ok(STRINGS[loc][COST_LABEL_KEYS[p.cost]], `${p.name} costKey 缺失@${loc}`);
    }
  }
  for (const loc of LOCALES) {
    for (const f of Object.keys(FILTER_LABEL_KEYS)) {
      assert.ok(STRINGS[loc][FILTER_LABEL_KEYS[f]], `filter ${f} 缺失@${loc}`);
    }
    assert.ok(STRINGS[loc]["settings.prop.cost"], `prop.cost 缺失@${loc}`);
    assert.ok(STRINGS[loc]["settings.prop.needKey"], `prop.needKey 缺失@${loc}`);
    assert.ok(STRINGS[loc]["settings.prop.noKey"], `prop.noKey 缺失@${loc}`);
  }
});

// —— tab 短名不含描述(无括号/无"需 key"字样) ——
test("providerMeta:tab 短名干净,只有短名", () => {
  for (const p of PROVIDER_META) {
    const label = STRINGS.zht[p.shortKey];
    assert.ok(!/[()（）]/.test(label), `${p.name} 短名不应含括号:${label}`);
    assert.ok(label.length <= 12, `${p.name} 短名过长:${label}`);
  }
});

// —— cost 分档符合约定 ——
test("providerMeta:cost 分档", () => {
  const cost = Object.fromEntries(PROVIDER_META.map((p) => [p.name, p.cost]));
  assert.deepEqual(cost, {
    "workers-ai": "free",
    pollinations: "free",
    "mac-llm": "free",
    glm: "freetier",
    gemini: "freetier",
    groq: "freetier",
    openrouter: "freetier",
    anthropic: "paid",
    custom: "paid",
  });
});

// —— pollinations key 选填(匿名可用,填 key 更稳) ——
test("providerMeta:pollinations optionalKey, 其余 nokey 无 key 字段", () => {
  const pol = PROVIDER_META.find((p) => p.name === "pollinations");
  assert.equal(pol.needsKey, false);
  assert.equal(pol.optionalKey, true);
  const wai = PROVIDER_META.find((p) => p.name === "workers-ai");
  assert.equal(wai.optionalKey ?? false, false);
});

// —— filter 同时是模型 filter ——
test("filterModels:free 只留 free:true", () => {
  const ms = [{ id: "a:free", free: true }, { id: "b" }, { id: "c", free: false }];
  assert.deepEqual(
    filterModels(ms, "free").map((m) => m.id),
    ["a:free"],
  );
});

test("filterModels:free 无 free 信息时不过滤(避免清空下拉)", () => {
  const ms = [{ id: "x" }, { id: "y" }];
  assert.deepEqual(
    filterModels(ms, "free").map((m) => m.id),
    ["x", "y"],
  );
});

test("filterModels:free 结果为空时回落全列表", () => {
  const ms = [{ id: "p", free: false }];
  assert.deepEqual(
    filterModels(ms, "free").map((m) => m.id),
    ["p"],
  );
});

test("filterModels:paid 踢掉 free:true,未知视为候选", () => {
  const ms = [{ id: "a:free", free: true }, { id: "b" }, { id: "c", free: false }];
  assert.deepEqual(
    filterModels(ms, "paid").map((m) => m.id),
    ["b", "c"],
  );
});

test("filterModels:paid 无 free 信息时全留", () => {
  const ms = [{ id: "x" }, { id: "y" }];
  assert.deepEqual(
    filterModels(ms, "paid").map((m) => m.id),
    ["x", "y"],
  );
});

test("filterModels:all/nokey 不过滤模型", () => {
  const ms = [{ id: "a", free: true }, { id: "b" }];
  assert.equal(filterModels(ms, "all"), ms);
  assert.equal(filterModels(ms, "nokey"), ms);
});

test("filterModels:空列表保持空", () => {
  assert.deepEqual(filterModels([], "free"), []);
  assert.deepEqual(filterModels([], "paid"), []);
});

test("staticModelEntries::free 后缀标 free:true", () => {
  assert.deepEqual(staticModelEntries(["google/gemma-4-31b-it:free", "glm-4-flash"]), [
    { id: "google/gemma-4-31b-it:free", free: true },
    { id: "glm-4-flash" },
  ]);
});

test("recommend:isRecommended 按 provider 判定", async () => {
  const { isRecommended } = await import("../test-dist/providerMeta.js");
  assert.equal(isRecommended("gemini", "gemini-3.8-flash"), true);
  assert.equal(isRecommended("gemini", "gemini-2.0-flash"), false);
  assert.equal(isRecommended("openrouter", "google/gemma-4-26b-a4b-it:free"), true);
  assert.equal(isRecommended("workers-ai", "@cf/mistralai/mistral-small-3.1-24b-instruct"), false);
});

test("recommend:filterRecommended 只留推荐,无交集时回落全列表", async () => {
  const { filterRecommended } = await import("../test-dist/providerMeta.js");
  const ms = [{ id: "gemini-3.8-flash" }, { id: "gemini-2.0-flash" }, { id: "gemini-flash-latest" }];
  assert.deepEqual(filterRecommended(ms, "gemini").map((m) => m.id), ["gemini-3.8-flash"]);
  assert.deepEqual(filterRecommended([{ id: "xxx-unknown" }], "gemini"), [{ id: "xxx-unknown" }]);
  assert.deepEqual(filterRecommended(ms, "workers-ai"), ms);
});

test("recommend:filterModels(recommended) 按 provider 过滤,models/ 前缀对齐", async () => {
  const { filterModels } = await import("../test-dist/providerMeta.js");
  const live = [{ id: "models/gemini-2.5-flash" }, { id: "models/gemini-3.8-flash" }, { id: "models/gemini-flash-latest" }];
  assert.deepEqual(filterModels(live, "recommended", "gemini").map((m) => m.id), ["models/gemini-3.8-flash"]);
  // 无推荐表的 provider → 不过滤
  assert.deepEqual(filterModels(live, "recommended", "workers-ai"), live);
  // 无 provider 参数 → 不过滤
  assert.deepEqual(filterModels(live, "recommended"), live);
});

test("recommend:filterProviders(recommended) 不隐藏 provider(只过滤模型)", async () => {
  const { filterProviders } = await import("../test-dist/providerMeta.js");
  assert.equal(filterProviders("recommended").length, 9);
});

test("retired:filterRetired 移除下架模型(models/ 前缀对齐),空结果回落", async () => {
  const { filterRetired } = await import("../test-dist/providerMeta.js");
  const ms = [{ id: "models/gemini-2.5-flash" }, { id: "gemini-2.0-flash" }, { id: "models/gemini-3.8-flash" }];
  assert.deepEqual(filterRetired(ms).map((m) => m.id), ["models/gemini-3.8-flash"]);
  const allDead = [{ id: "gemini-2.0-flash" }];
  assert.deepEqual(filterRetired(allDead), allDead);
  assert.deepEqual(filterRetired([]), []);
});

test("providerMeta:mac-llm 免 key 免费组,推荐含 qwen3:30b/8b", async () => {
  const { PROVIDER_META, RECOMMENDED_MODELS, STATIC_MODELS } = await import("../test-dist/providerMeta.js");
  const m = PROVIDER_META.find((p) => p.name === "mac-llm");
  assert.ok(m, "mac-llm in PROVIDER_META");
  assert.equal(m.group, "nokey");
  assert.equal(m.cost, "free");
  assert.equal(m.needsKey, false);
  assert.deepEqual(RECOMMENDED_MODELS["mac-llm"], ["qwen3:30b", "qwen3:8b"]);
  assert.ok(STATIC_MODELS["mac-llm"].includes("qwen3:30b"));
  assert.ok(STATIC_MODELS["mac-llm"].includes("qwen3:32b"));
});
