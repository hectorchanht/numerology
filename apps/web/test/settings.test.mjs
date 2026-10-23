import { test } from "node:test";
import assert from "node:assert/strict";
import {
  migrateAiSettings,
  currentKey,
  DEFAULT_AI,
} from "../test-dist/aiSettings.js";
import {
  aiCacheKey,
  teeTextStream,
  prepareCachedStream,
  AI_CACHE_PREFIX,
} from "../test-dist/aiCache.js";
import {
  mergeSectionInto,
  summarizeInput,
  readingId,
} from "../test-dist/history.js";
import { stableInputHash } from "../test-dist/hash.js";

// —— A. 分 provider 记 key:迁移 ——
test("migrateAiSettings:旧版单 apiKey 归到当时选中的 provider 名下", () => {
  const out = migrateAiSettings({ provider: "openrouter", apiKey: "sk-old", model: "", baseURL: "" });
  assert.equal(out.keys.openrouter, "sk-old");
  assert.equal(out.apiKey, undefined);
  assert.equal(out.provider, "openrouter");
});

test("migrateAiSettings:新版 keys 原样保留,旧 apiKey 不再顶替", () => {
  const out = migrateAiSettings({
    provider: "glm",
    keys: { glm: "glm-key", openrouter: "or-key" },
    apiKey: "sk-stale",
  });
  assert.deepEqual(out.keys, { glm: "glm-key", openrouter: "or-key" });
});

test("migrateAiSettings:空输入/非法输入 → 默认", () => {
  assert.deepEqual(migrateAiSettings(null).keys, {});
  assert.equal(migrateAiSettings("nope").provider, DEFAULT_AI.provider);
  assert.equal(migrateAiSettings({}).systemPrompt, "");
});

test("currentKey:只取当前 provider 的 key,没填 → 空(不拿别的顶替)", () => {
  const s = { ...DEFAULT_AI, provider: "glm", keys: { openrouter: "or-key" } };
  assert.equal(currentKey(s), "");
  const s2 = { ...DEFAULT_AI, provider: "openrouter", keys: { openrouter: "  or-key " } };
  assert.equal(currentKey(s2), "or-key");
});

// —— C. 缓存键稳定 ——
const baseParts = {
  provider: "workers-ai",
  model: "",
  locale: "zht",
  lens: "both",
  section: "personality",
  inputHash: "abc123",
  promptHash: "def456",
};

test("aiCacheKey:同一输入 → 同一键,且带 aicache: 前缀", async () => {
  const a = await aiCacheKey(baseParts);
  const b = await aiCacheKey({ ...baseParts });
  assert.equal(a, b);
  assert.ok(a.startsWith(AI_CACHE_PREFIX));
  assert.equal(a.length, AI_CACHE_PREFIX.length + 64);
});

test("aiCacheKey:locale/section/人设不同 → 键不同", async () => {
  const a = await aiCacheKey(baseParts);
  assert.notEqual(a, await aiCacheKey({ ...baseParts, locale: "en" }));
  assert.notEqual(a, await aiCacheKey({ ...baseParts, section: "career" }));
  assert.notEqual(a, await aiCacheKey({ ...baseParts, promptHash: "other" }));
  assert.notEqual(a, await aiCacheKey({ ...baseParts, model: "x" }));
});

test("stableInputHash:同一输入稳定,不同输入不同;minute 缺省按 0", async () => {
  const h1 = await stableInputHash({ year: 1990, month: 6, day: 15, hour: 14, gender: "男" });
  const h2 = await stableInputHash({ year: 1990, month: 6, day: 15, hour: 14, minute: 0, gender: "男" });
  assert.equal(h1, h2);
  const h3 = await stableInputHash({ year: 1990, month: 6, day: 15, hour: 14, minute: 30, gender: "男" });
  assert.notEqual(h1, h3);
});

// —— C. tee:转发 + 累积 ——
function fakeStream(chunks) {
  const listeners = { text: [], error: [] };
  return {
    on(e, l) {
      listeners[e].push(l);
      return this;
    },
    finalMessage() {
      return (async () => {
        for (const c of chunks) for (const l of listeners.text) l(c);
      })();
    },
    abort() {},
  };
}

test("teeTextStream:转发 text 给下游并累积全文", async () => {
  const inner = fakeStream(["hello ", "world"]);
  const { stream, acc } = teeTextStream(inner);
  const seen = [];
  stream.on("text", (d) => seen.push(d));
  await stream.finalMessage();
  assert.deepEqual(seen, ["hello ", "world"]);
  assert.equal(acc.text, "hello world");
});

// —— C. prepareCachedStream:HIT/MISS ——
test("prepareCachedStream:HIT 直接返回 X-Cache: HIT,不创建流", async () => {
  const kv = {
    get: async () => "cached-markdown",
    put: async () => {
      throw new Error("HIT 时不应写入");
    },
  };
  const r = await prepareCachedStream(kv, baseParts, () => {
    throw new Error("HIT 时不应创建流");
  });
  assert.ok("hit" in r);
  assert.equal(r.hit.headers.get("X-Cache"), "HIT");
  assert.equal(await r.hit.text(), "cached-markdown");
});

test("prepareCachedStream:MISS 返回 miss,armPersistence(null) 不抛错", async () => {
  const kv = { get: async () => null, put: async () => {} };
  let created = false;
  const r = await prepareCachedStream(kv, baseParts, () => {
    created = true;
    return fakeStream(["x"]);
  });
  assert.ok("miss" in r);
  assert.ok(created);
  assert.ok(r.miss.cacheKey.startsWith(AI_CACHE_PREFIX));
  r.miss.armPersistence(null); // 无 waitUntil → 静默跳过
});

// —— D. 历史纯逻辑 ——
test("mergeSectionInto:合并章节,不污染原对象", () => {
  const r = {
    id: "id1", createdAt: 1, updatedAt: 1, input: {}, locale: "zht", chart: {},
    sections: { "report:a": { markdown: "A", lens: "both", provider: "p", model: "m", at: 1 } },
  };
  const s = { markdown: "B", lens: "bazi", provider: "p", model: "m", at: 2 };
  const out = mergeSectionInto(r, "report:b", s);
  assert.equal(out.sections["report:a"].markdown, "A");
  assert.equal(out.sections["report:b"].markdown, "B");
  assert.equal(out.updatedAt, 2);
  assert.equal(Object.keys(r.sections).length, 1);
});

test("summarizeInput:摘要格式", () => {
  assert.equal(
    summarizeInput({ year: 1990, month: 6, day: 15, hour: 14, minute: 5, gender: "男" }),
    "1990-06-15 14:05 男",
  );
});

test("readingId:同一输入稳定", async () => {
  const input = { year: 1990, month: 6, day: 15, hour: 14, gender: "男" };
  assert.equal(await readingId(input), await readingId({ ...input }));
});
