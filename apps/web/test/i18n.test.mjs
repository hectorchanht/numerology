import { test } from "node:test";
import assert from "node:assert/strict";
import { STRINGS, DEFAULT_LOCALE, LOCALES, fmt, setLocale } from "../test-dist/i18n.js";

// —— 默认语言为繁体 ——
test("i18n:默认语言为 zht,三种语言齐备", () => {
  assert.equal(DEFAULT_LOCALE, "zht");
  assert.deepEqual([...LOCALES].sort(), ["en", "zhs", "zht"]);
});

// —— 字典完整性:三地 key 完全一致 ——
test("i18n:zht/zhs/en 的 key 集合完全一致", () => {
  const zhtKeys = Object.keys(STRINGS.zht).sort();
  for (const l of ["zhs", "en"]) {
    assert.deepEqual(Object.keys(STRINGS[l]).sort(), zhtKeys, `${l} 的 key 集合与 zht 不一致`);
  }
});

test("i18n:所有文案非空字符串", () => {
  for (const l of ["zht", "zhs", "en"]) {
    for (const [k, v] of Object.entries(STRINGS[l])) {
      assert.equal(typeof v, "string", `${l}.${k} 应为字符串`);
      assert.ok(v.length > 0, `${l}.${k} 不应为空`);
    }
  }
});

test("i18n:关键默认文案为繁体", () => {
  assert.equal(STRINGS.zht["form.title"], "輸入出生信息");
  assert.equal(STRINGS.zht["form.submit"], "排盤");
  assert.equal(STRINGS.zht["mode.known"], "我知道出生時辰");
  assert.equal(STRINGS.zhs["form.title"], "输入出生信息");
  assert.equal(STRINGS.en["form.title"], "Birth details");
});

// —— fmt 占位符 ——
test("i18n:fmt 填充 {name} 占位符,缺失保留原样", () => {
  assert.equal(fmt("已完成 {done}/{total} 节", { done: 2, total: 7 }), "已完成 2/7 节");
  assert.equal(fmt("a {x} b", {}), "a {x} b");
});

// —— setLocale 在 node 环境不抛错(无 window) ——
test("i18n:setLocale 无浏览器环境不抛错", () => {
  assert.doesNotThrow(() => setLocale("en"));
  setLocale("zht");
});
