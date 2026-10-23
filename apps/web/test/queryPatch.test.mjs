import { test } from "node:test";
import assert from "node:assert/strict";
import { applyQueryPatch } from "../test-dist/queryPatch.js";

test("queryPatch:加 param", () => {
  assert.equal(applyQueryPatch("", { case: "chen-jingzhong" }), "?case=chen-jingzhong");
  assert.equal(applyQueryPatch("?q=%E4%B9%BE", { gua: "1" }), "?q=%E4%B9%BE&gua=1");
});

test("queryPatch:刪 param(null 或空字串)", () => {
  assert.equal(applyQueryPatch("?case=abc", { case: null }), "");
  assert.equal(applyQueryPatch("?q=乾&gua=1", { q: "" }), "?gua=1");
  assert.equal(applyQueryPatch("?q=乾", { q: null }), "");
});

test("queryPatch:保留無關 param,覆寫同名", () => {
  assert.equal(applyQueryPatch("?q=乾&gua=1", { gua: "2" }), "?q=%E4%B9%BE&gua=2");
  assert.equal(applyQueryPatch("?gua=1&tab=career", { tab: null }), "?gua=1");
});

test("queryPatch:接受有冇問號前綴", () => {
  assert.equal(applyQueryPatch("q=乾", { gua: "1" }), "?q=%E4%B9%BE&gua=1");
});
