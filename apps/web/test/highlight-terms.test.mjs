import { test } from "node:test";
import assert from "node:assert/strict";
import {
  findTermMatches,
  allGlossary,
  lookupTerm,
  markdownTermComponents,
} from "../test-dist/highlightTerms.js";
import { YIJING_GLOSSARY, MINGLI_GLOSSARY } from "@numerology/knowledge";

const T = (term) => ({ term, zht: "x", zhs: "x", en: "x" });

test("最長匹配勝出:「正官」不被切成「官」", () => {
  const terms = [T("官"), T("正官")];
  const ms = findTermMatches("正官格", terms);
  assert.equal(ms.length, 1);
  assert.deepEqual(ms[0], { start: 0, end: 2, term: "正官" });
});

test("命中不重疊、按出現順序排列", () => {
  const terms = [T("正官"), T("七殺"), T("官殺")];
  const ms = findTermMatches("正官與七殺同現", terms);
  assert.deepEqual(
    ms.map((m) => m.term),
    ["正官", "七殺"],
  );
  for (let i = 1; i < ms.length; i++) {
    assert.ok(ms[i].start >= ms[i - 1].end, "範圍重疊");
  }
});

test("相鄰命中兩個都找得到", () => {
  const ms = findTermMatches("正官正官", [T("正官")]);
  assert.equal(ms.length, 2);
  assert.deepEqual(ms[0], { start: 0, end: 2, term: "正官" });
  assert.deepEqual(ms[1], { start: 2, end: 4, term: "正官" });
});

test("術語含正則特殊字元不拋錯、按字面匹配", () => {
  const terms = [T("a+b"), T("(c)"), T("d.e")];
  assert.deepEqual(findTermMatches("xa+bz", terms).map((m) => m.term), ["a+b"]);
  assert.deepEqual(findTermMatches("x(c)z", terms).map((m) => m.term), ["(c)"]);
  assert.deepEqual(findTermMatches("xd.ez", terms).map((m) => m.term), ["d.e"]);
  // 真實術語:含斜線與空格
  const ms = findTermMatches("九 / 六者陽", undefined);
  assert.ok(ms.some((m) => m.term === "九 / 六"), "應命中「九 / 六」");
});

test("空字串 → [],空術語表 → []", () => {
  assert.deepEqual(findTermMatches("", [T("正官")]), []);
  assert.deepEqual(findTermMatches("正官", []), []);
  assert.deepEqual(findTermMatches("", []), []);
});

test("命中前後的中日韓文字原樣保留(可還原原文)", () => {
  const text = "此命正官透干,七殺暗藏,大運逢沖則動。";
  const ms = findTermMatches(text);
  assert.ok(ms.length >= 3, `期望 ≥3 個命中,實得 ${ms.length}`);
  let cursor = 0;
  let rebuilt = "";
  for (const m of ms) {
    rebuilt += text.slice(cursor, m.start) + m.term;
    cursor = m.end;
  }
  rebuilt += text.slice(cursor);
  assert.equal(rebuilt, text, "命中拼接應還原原文");
});

test("合併術語表:去重、易經碰撞優先", () => {
  const all = allGlossary();
  const terms = all.map((g) => g.term);
  assert.equal(new Set(terms).size, terms.length, "合併後仍有重複 term");
  assert.ok(all.length >= YIJING_GLOSSARY.length + MINGLI_GLOSSARY.length - 5);
  assert.ok(terms.includes("正官") && terms.includes("卦"), "兩表術語皆應在列");
  // 七殺來自命理表(兩表皆有概念但 term 不同字,此處驗合併查找可用)
  const qisha = lookupTerm("七殺");
  assert.ok(qisha && qisha.zht.includes("主星"));
  assert.equal(lookupTerm("不存在的術語"), undefined);
});

test("markdownTermComponents:只覆寫文本標籤,不碰 code/pre/a", () => {
  const keys = Object.keys(markdownTermComponents).sort();
  assert.deepEqual(keys, ["blockquote", "em", "h1", "h2", "h3", "h4", "li", "p", "strong", "td", "th"]);
  for (const k of keys) {
    assert.equal(typeof markdownTermComponents[k], "function", `${k} 應為組件函數`);
  }
});
