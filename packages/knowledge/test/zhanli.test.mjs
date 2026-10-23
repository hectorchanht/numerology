import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ZHANLI_CASES,
  allCases,
  getCase,
  getHexagram,
} from "../dist/index.js";

const VERDICTS = ["應驗", "部分應驗", "存疑"];

test("占例庫:案例數 5–8, id 唯一", () => {
  assert.ok(
    ZHANLI_CASES.length >= 5 && ZHANLI_CASES.length <= 8,
    `案例數應為 5–8,實得 ${ZHANLI_CASES.length}`,
  );
  const ids = ZHANLI_CASES.map((c) => c.id);
  assert.deepEqual([...new Set(ids)].sort(), [...ids].sort(), "id 必須唯一");
});

test("占例庫:每例欄位齊全非空", () => {
  for (const c of ZHANLI_CASES) {
    for (const k of [
      "id",
      "title",
      "sourceLabel",
      "sourceUrl",
      "originalText",
    ]) {
      const v = c[k];
      assert.equal(typeof v, "string", `${c.id}.${k} 應為字符串`);
      assert.ok(v.length > 0, `${c.id}.${k} 不應為空`);
    }
    assert.ok(
      c.sourceUrl.startsWith("https://zh.wikisource.org/"),
      `${c.id}.sourceUrl 須為已核實的維基文庫鏈接`,
    );
    assert.ok(
      Array.isArray(c.baihua) && c.baihua.length > 0,
      `${c.id}.baihua 應為非空段落數組`,
    );
    for (const p of c.baihua)
      assert.ok(p.length > 0, `${c.id}.baihua 段落不應為空`);
  }
});

test("占例庫:占斷欄位有效,卦名與卦序一致", () => {
  for (const c of ZHANLI_CASES) {
    const d = c.divination;
    assert.ok(d.method.length > 0, `${c.id}.divination.method 不應為空`);
    const hex = getHexagram(d.hexagramNum);
    assert.ok(hex, `${c.id}.hexagramNum ${d.hexagramNum} 無此卦`);
    assert.equal(
      hex.name,
      d.hexagram,
      `${c.id}.hexagram 卦名與卦序不一致`,
    );
    if (d.changedTo) {
      assert.ok(d.changedToNum, `${c.id}.changedTo 有卦名須有卦序`);
      const ch = getHexagram(d.changedToNum);
      assert.ok(ch, `${c.id}.changedToNum ${d.changedToNum} 無此卦`);
      assert.equal(ch.name, d.changedTo, `${c.id}.changedTo 卦名與卦序不一致`);
    }
    assert.ok(d.movingLines.length > 0, `${c.id}.movingLines 不應為空`);
  }
});

test("占例庫:結局 verdict 合法、理由非空", () => {
  for (const c of ZHANLI_CASES) {
    assert.ok(
      VERDICTS.includes(c.outcome.verdict),
      `${c.id}.verdict 非法: ${c.outcome.verdict}`,
    );
    assert.ok(c.outcome.text.length > 0, `${c.id}.outcome.text 不應為空`);
    assert.ok(c.outcome.reason.length > 0, `${c.id}.outcome.reason 不應為空`);
  }
});

test("占例庫:引文參照 quote 須在白話解說中逐字出現", () => {
  for (const c of ZHANLI_CASES) {
    assert.ok(
      Array.isArray(c.quoteRefs) && c.quoteRefs.length > 0,
      `${c.id}.quoteRefs 應為非空數組`,
    );
    const body = c.baihua.join("\n");
    for (const q of c.quoteRefs) {
      assert.ok(q.id.length > 0 && q.quote.length > 0, `${c.id} 引文 id/quote 非空`);
      assert.ok(
        q.url.startsWith("https://zh.wikisource.org/"),
        `${c.id} 引文 url 須為維基文庫`,
      );
      assert.ok(
        body.includes(q.quote),
        `${c.id} 引文「${q.quote}」未在白話解說中逐字出現`,
      );
    }
  }
});

test("占例庫:allCases/getCase 輔助函數", () => {
  assert.equal(allCases().length, ZHANLI_CASES.length);
  const c = getCase("mujiang");
  assert.ok(c, "應能取到 mujiang");
  assert.equal(c.title, "穆姜占");
  assert.equal(getCase("no-such-case"), undefined);
});
