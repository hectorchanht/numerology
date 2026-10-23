import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PROVIDER_META,
  FILTER_LABEL_KEYS,
  COST_LABEL_KEYS,
  filterProviders,
} from "../test-dist/providerMeta.js";
import { STRINGS, LOCALES } from "../test-dist/i18n.js";

const names = (ps) => ps.map((p) => p.name);

// —— filter chips 分组 ——
test("filter:all=8, nokey=2, free=6(免key∪免费额度), paid=2", () => {
  assert.deepEqual(names(filterProviders("all")),
    ["workers-ai", "pollinations", "glm", "gemini", "groq", "openrouter", "anthropic", "custom"]);
  assert.deepEqual(names(filterProviders("nokey")), ["workers-ai", "pollinations"]);
  assert.deepEqual(names(filterProviders("free")),
    ["workers-ai", "pollinations", "glm", "gemini", "groq", "openrouter"]);
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
