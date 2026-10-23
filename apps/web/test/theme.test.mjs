import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_THEME,
  THEME_KEY,
  THEME_COLOR,
  parseTheme,
  nextTheme,
  THEME_INIT_SCRIPT,
} from "../test-dist/theme.js";

test("DARK-THEME DEFAULT:預設 dark", () => {
  assert.equal(DEFAULT_THEME, "dark");
  assert.equal(THEME_KEY, "numerology-theme");
});

test("parseTheme:只接受 dark / light,其他一律回預設", () => {
  assert.equal(parseTheme("light"), "light");
  assert.equal(parseTheme("dark"), "dark");
  assert.equal(parseTheme(null), "dark");
  assert.equal(parseTheme(""), "dark");
  assert.equal(parseTheme("LIGHT"), "dark");
  assert.equal(parseTheme("blue"), "dark");
});

test("nextTheme:dark ↔ light 互換", () => {
  assert.equal(nextTheme("dark"), "light");
  assert.equal(nextTheme("light"), "dark");
});

test("theme-color:dark 黑、light 白", () => {
  assert.equal(THEME_COLOR.dark, "#000000");
  assert.equal(THEME_COLOR.light, "#ffffff");
});

/** 喺假 DOM 跑 inline script,確認首幀前已套用主題同 theme-color。 */
function runInit(stored, { throwOnRead = false } = {}) {
  const meta = { content: "#000000" };
  const root = { dataset: {}, style: {} };
  const localStorage = {
    getItem: (k) => {
      if (throwOnRead) throw new Error("blocked");
      return k === THEME_KEY ? stored : null;
    },
  };
  let metaParsed = false; // 模擬:script 執行時 theme-color meta 未必已解析
  const onReady = [];
  const document = {
    documentElement: root,
    querySelector: (sel) => (metaParsed && sel === 'meta[name="theme-color"]' ? meta : null),
    addEventListener: (ev, fn) => ev === "DOMContentLoaded" && onReady.push(fn),
  };
  new Function("document", "localStorage", THEME_INIT_SCRIPT)(document, localStorage);
  metaParsed = true;
  onReady.forEach((fn) => fn());
  return { root, meta };
}

test("THEME_INIT_SCRIPT:已存 light → data-theme=light + theme-color 白", () => {
  const { root, meta } = runInit("light");
  assert.equal(root.dataset.theme, "light");
  assert.equal(meta.content, "#ffffff");
});

test("THEME_INIT_SCRIPT:冇存 / 亂值 → 保持 dark", () => {
  for (const v of [null, "weird"]) {
    const { root, meta } = runInit(v);
    assert.equal(root.dataset.theme, "dark");
    assert.equal(meta.content, "#000000");
  }
});

test("THEME_INIT_SCRIPT:localStorage 被封(私隱模式)都唔會拋錯", () => {
  const { root } = runInit(null, { throwOnRead: true });
  assert.equal(root.dataset.theme, undefined);
});
