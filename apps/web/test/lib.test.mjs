import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDotEnvLine } from "../test-dist/env.js";
import { classifyError, errorResponse } from "../test-dist/http.js";
import { parseBirthInput, parseHourInferInput } from "../test-dist/birth.js";

// —— Bug 4: .env 解析器 ——
test("env:export 前缀 / 引号 / 行尾注释 / 小写 key", () => {
  assert.deepEqual(parseDotEnvLine("A=1"), ["A", "1"]);
  assert.deepEqual(parseDotEnvLine("export FOO=bar"), ["FOO", "bar"]);
  assert.deepEqual(parseDotEnvLine('  export Q="a b"  '), ["Q", "a b"]);
  assert.deepEqual(parseDotEnvLine("S='x#y'"), ["S", "x#y"]);
  assert.deepEqual(parseDotEnvLine('D="a\\"b"'), ["D", 'a"b']);
  assert.deepEqual(parseDotEnvLine("U=abc # 注释"), ["U", "abc"]);
  assert.deepEqual(parseDotEnvLine("low_key=v"), ["low_key", "v"]);
  assert.deepEqual(parseDotEnvLine("# 纯注释"), null);
  assert.deepEqual(parseDotEnvLine(""), null);
  assert.deepEqual(parseDotEnvLine("no-equals"), null);
  assert.deepEqual(parseDotEnvLine("9bad=x"), null);
});

// —— Bug 2: 错误分类 ——
test("http:输入错误 → 400,未知 provider → 400", () => {
  assert.equal(classifyError(new Error("非法出生信息: 日 30(2023年2月只有 28 天)")).status, 400);
  assert.equal(classifyError(new Error("请求体格式错误")).status, 400);
  assert.equal(classifyError(new Error('未知 AI provider="foo"。可选:a / b')).status, 400);
  assert.equal(classifyError(new Error("字段 year 必须为整数(收到 1990.5)")).status, 400);
});

test("http:AI 上游错误 → 502 且透出真实消息(REAL-ERROR RULE)", () => {
  const cases = [
    [new Error("缺少 智谱 GLM-4-Flash(免费) 的 API key。请在设置里填入"), "API key"],
    [Object.assign(new Error("Rate limit reached"), { status: 429 }), "Rate limit reached"],
    [Object.assign(new Error("Connection error."), {}), "Connection error."],
    [Object.assign(new Error("Internal Server Error"), { status: 500 }), "Internal Server Error"],
    [new Error("AI 请求超时:20s 内未收到首个文本块"), "20s 内未收到首个文本块"],
    // 模型下架 404:真实消息必须原样透出(含 provider 的更换建议)
    [
      Object.assign(
        new Error("404 This model models/gemini-2.0-flash is no longer available. Please update your code to use models/gemini-3.8-flash"),
        { status: 404 },
      ),
      "gemini-3.8-flash",
    ],
  ];
  for (const [err, want] of cases) {
    const c = classifyError(err, "ai");
    assert.equal(c.status, 502, `${err.message} 应为 502`);
    assert.ok(c.message.includes(want), `502 信息应透出真实消息(含「${want}」): ${c.message}`);
  }
  // AI 阶段未知错误兜底 502;输入阶段未知错误保持 400。消息均为原样。
  assert.equal(classifyError(new Error("mystery"), "ai").status, 502);
  assert.equal(classifyError(new Error("mystery"), "ai").message, "mystery");
  assert.equal(classifyError(new Error("mystery"), "input").status, 400);
});

test("http:超长真实消息截断但不改写", () => {
  const long = "x".repeat(2000);
  const c = classifyError(Object.assign(new Error(long), { status: 502 }), "ai");
  assert.equal(c.status, 502);
  assert.ok(c.message.length <= 1501, `应截断: ${c.message.length}`);
  assert.ok(c.message.startsWith("x".repeat(100)));
});

test("http:预算耗尽 → 429 且去掉内部标记", () => {
  const err = new Error("AI_BUDGET_EXCEEDED:本月 Workers AI 用量已達上限($2),請下個月再試");
  const c = classifyError(err, "ai");
  assert.equal(c.status, 429);
  assert.ok(!c.message.includes("AI_BUDGET_EXCEEDED"), "内部标记不应暴露给用户");
  assert.ok(c.message.includes("用量已達上限"));
  // 普通 429 限流仍走 502
  const rl = Object.assign(new Error("Rate limit reached"), { status: 429 });
  assert.equal(classifyError(rl, "ai").status, 502);
});

test("http:binding 未配置 → 502 但保留原消息", () => {
  const c = classifyError(new Error("Workers AI binding 未配置:请在 Cloudflare Pages 添加 AI binding"), "ai");
  assert.equal(c.status, 502);
  assert.ok(c.message.includes("binding 未配置"));
});

test("http:errorResponse 返回对应状态码的 JSON", async () => {
  const r = errorResponse(new Error("非法出生信息: 月 13"), { fallback: "x" });
  assert.equal(r.status, 400);
  const j = await r.json();
  assert.ok(j.error.includes("非法出生信息"));
});

// —— Bug 5: 边界解析 ——
test("birth:拒绝非整数 / 经度越界,小数经度通过", () => {
  const base = { year: 1990, month: 5, day: 30, hour: 11, minute: 0, gender: "男" };
  assert.throws(() => parseBirthInput({ ...base, year: 1990.5 }), /必须为整数/);
  assert.throws(() => parseBirthInput({ ...base, longitude: 200 }), /经度.*超出范围/);
  assert.throws(() => parseBirthInput({ ...base, longitude: -181 }), /经度.*超出范围/);
  const ok = parseBirthInput({ ...base, longitude: 116.4 });
  assert.equal(ok.longitude, 116.4);
  assert.throws(() => parseHourInferInput({ ...base, longitude: 999 }), /经度/);
});

// —— Bug 6: 农历换算后超出范围 ——
test("birth:农历换算后超出 1900-2100 → 明确报错", () => {
  // 农历 2100 年腊月廿九 → 公历 2101-1-28:应报换算越界,而非下游「年 2101」。
  assert.throws(
    () => parseBirthInput({ year: 2100, month: 12, day: 29, hour: 12, gender: "男", calendar: "lunar" }),
    /换算为公历2101年1月28日.*超出引擎支持范围/,
  );
  // 非法闰月:该年无此闰月。
  assert.throws(
    () => parseBirthInput({ year: 2024, month: 2, day: 15, hour: 12, gender: "男", calendar: "lunar", isLeapMonth: true }),
    /非法农历日期|无此闰月/,
  );
  // 正常农历转换不受影响。
  const ok = parseBirthInput({ year: 2000, month: 1, day: 1, hour: 12, gender: "男", calendar: "lunar" });
  assert.equal(ok.year, 2000);
  assert.equal(ok.month, 2);
  assert.equal(ok.day, 5);
});
