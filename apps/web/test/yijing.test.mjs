import { test } from "node:test";
import assert from "node:assert/strict";
import {
  YIJING_STRINGS,
  YIJING_LOCALES,
  yjT,
  yjFmt,
} from "../test-dist/yijingStrings.js";
import { SITE_BASE, SITE_ROUTES } from "../test-dist/yijingSite.js";

// —— 三地字典完整性 ——
test("yijingStrings:三地齊備且默認含 zht", () => {
  assert.deepEqual([...YIJING_LOCALES].sort(), ["en", "zhs", "zht"]);
});

test("yijingStrings:zht/zhs/en 的 key 集合完全一致", () => {
  const ids = Object.keys(YIJING_STRINGS).sort();
  assert.ok(ids.length > 40, `文案數量過少: ${ids.length}`);
  for (const id of ids) {
    const locales = Object.keys(YIJING_STRINGS[id]).sort();
    assert.deepEqual(locales, ["en", "zhs", "zht"], `${id} 的語言集合不一致`);
  }
});

test("yijingStrings:所有文案非空字符串", () => {
  for (const id of Object.keys(YIJING_STRINGS)) {
    for (const l of YIJING_LOCALES) {
      const v = YIJING_STRINGS[id][l];
      assert.equal(typeof v, "string", `${id}.${l} 應為字符串`);
      assert.ok(v.length > 0, `${id}.${l} 不應為空`);
    }
  }
});

test("yijingStrings:關鍵文案三地正確", () => {
  assert.equal(yjT("nav.yijing", "zht"), "易經占卦");
  assert.equal(yjT("nav.yijing", "zhs"), "易经占卦");
  assert.equal(yjT("nav.yijing", "en"), "Yi Jing Divination");
  assert.equal(yjT("poster.title", "en"), "Chart Poster");
});

// —— yjT / yjFmt ——
test("yijingStrings:yjT 缺 key 回落 key 本身", () => {
  assert.equal(yjT("no.such.key", "zht"), "no.such.key");
});

test("yijingStrings:yjFmt 填充佔位符", () => {
  assert.equal(yjFmt(yjT("yijing.toss", "zht"), { n: 3 }), "擲第 3 爻");
  assert.equal(yjFmt("a {missing} b", {}), "a {missing} b");
});

// —— sitemap 路由 ——
test("yijingSite:包含全部公開路由且形狀正確", () => {
  assert.equal(SITE_BASE, "https://numerology.dawnstudio.app");
  const paths = SITE_ROUTES.map((r) => r.path);
  for (const p of ["/", "/yijing", "/yijing/gua", "/poster"]) {
    assert.ok(paths.includes(p), `缺少路由 ${p}`);
  }
  for (const r of SITE_ROUTES) {
    assert.ok(r.path.startsWith("/"), `路由應以 / 開頭: ${r.path}`);
    assert.ok(r.priority > 0 && r.priority <= 1, `priority 越界: ${r.path}`);
  }
});
