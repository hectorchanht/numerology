import { test} from "node:test";
import assert from "node:assert/strict";
import { chatStream, chatComplete} from "../dist/client.js";
import { budgetMonthKey, BUDGET_NEURONS} from "../dist/budget.js";

function memKv(seed = {}) {
const m = new Map(Object.entries(seed));
return { get: async (k) => (m.has(k)? m.get(k): null), put: async (k, v) => { m.set(k, v);}};
}

function sseStream(events) {
const enc = new TextEncoder();
return new ReadableStream({
start(c) {
for (const e of events) c.enqueue(enc.encode(`data: ${JSON.stringify(e)}\n\n`));
c.enqueue(enc.encode("data: [DONE]\n\n"));
c.close();
},
});
}

function fakeBinding(captured, chunks) {
return {
run: async (model, input) => {
captured.model = model;
captured.input = input;
return sseStream(chunks);
},
};
}

const SYSTEM = [
{ text: "你是命理師。"},
{ text: "請全程使用繁體中文(香港用語)撰寫。"},
];
const MSGS = [{ role: "user", content: "寫兩句。"}];

// —— 语言指令被前置到 user 消息 ——
test("workers-ai:语言指令前置到首条 user 消息,system 保留", async () => {
const captured = {};
const kv = memKv();
const binding = fakeBinding(captured, [
{ response: "甲", usage: { neurons: 0.5}},
{ response: "乙", usage: { neurons: 1.2}},
]);
const stream = chatStream(
{ kind: "chat", system: SYSTEM, messages: MSGS, maxTokens: 100},
{ provider: "workers-ai", aiBinding: { ai: binding, kv}},
);
const got = [];
stream.on("text", (d) => got.push(d));
const final = await stream.finalMessage();
assert.equal(final.text, "甲乙");
assert.equal(final.neurons, 1.2);
assert.deepEqual(got, ["甲", "乙"]);
// 首条 user 消息以语言指令开头
const sentMsgs = captured.input.messages;
assert.ok(sentMsgs[0].role === "system", "首条应为 system");
assert.ok(sentMsgs[1].content.startsWith(""), "语言指令应前置到 user 消息");
assert.ok(sentMsgs[1].content.includes("寫兩句。"));
// system 块原样保留(含指令,双保险)
assert.ok(sentMsgs[0].content.includes(""));
// 预算已记账
const total = Number(await kv.get(budgetMonthKey()));
assert.equal(total, 1.2);
});

// —— 无 binding 时给明确报错 ——
test("workers-ai:无 binding 抛明确错误(含指引)", () => {
assert.throws(
() => chatStream({ kind: "chat", system: SYSTEM, messages: MSGS, maxTokens: 100}, { provider: "workers-ai"}),
/binding 未配置/,
);
});

test("workers-ai:无 KV 时抛明确错误(预算守卫 fail-closed)", () => {
const captured = {};
assert.throws(
() => chatStream(
{ kind: "chat", system: SYSTEM, messages: MSGS, maxTokens: 100},
{ provider: "workers-ai", aiBinding: { ai: fakeBinding(captured, [])}},
),
/AI_BUDGET_KV 未配置/,
);
});

// —— 超预算时不调用 binding,直接抛 ——
test("workers-ai:超预算时拒绝且不调用模型", async () => {
const kv = memKv({ [budgetMonthKey()]: String(BUDGET_NEURONS)});
let called = false;
const binding = { run: async () => { called = true;}};
const stream = chatStream(
{ kind: "chat", system: SYSTEM, messages: MSGS, maxTokens: 100},
{ provider: "workers-ai", aiBinding: { ai: binding, kv}},
);
await assert.rejects(stream.finalMessage(), /AI_BUDGET_EXCEEDED/);
assert.equal(called, false);
});

// —— 非流式 chatComplete 同样走预算 ——
test("workers-ai:chatComplete 返回文本并记账", async () => {
const kv = memKv();
const binding = {
run: async (model, input) => {
assert.ok(input.messages[1].content.startsWith(""));
return { response: "好", usage: { prompt_tokens: 10, completion_tokens: 5, neurons: 0.8}};
},
};
const { chatComplete: cc} = await import("../dist/client.js");
const r = await cc(
{ kind: "chat", system: SYSTEM, messages: MSGS, maxTokens: 100},
{ provider: "workers-ai", aiBinding: { ai: binding, kv}},
);
assert.equal(r.text, "好");
assert.equal(r.usage.neurons, 0.8);
assert.equal(Number(await kv.get(budgetMonthKey())), 0.8);
});

// —— v3:decode params 随请求传给 Workers AI ——
test("workers-ai:chatComplete 传入 decode baseline(temp 0.7/top_p 0.9/rep 1.1)", async () => {
const captured = {};
const binding = { run: async (model, input) => { captured.input = input; return { response: "好", usage: { neurons: 0.1}};}};
const kv = memKv();
const { chatComplete: cc} = await import("../dist/client.js");
await cc(
{ kind: "report", system: SYSTEM, messages: MSGS, maxTokens: 100},
{ provider: "workers-ai", aiBinding: { ai: binding, kv}},
);
assert.equal(captured.input.temperature, 0.7);
assert.equal(captured.input.top_p, 0.9);
assert.equal(captured.input.repetition_penalty, 1.1);
assert.equal(captured.input.stream, undefined);
});

test("workers-ai:stream 传入 decode params,env 可覆盖", async () => {
const captured = {};
const binding = fakeBinding(captured, [{ response: "好"}]);
const kv = memKv();
process.env.AI_TEMPERATURE = "0.85";
try {
const stream = chatStream(
{ kind: "chat", system: SYSTEM, messages: MSGS, maxTokens: 100},
{ provider: "workers-ai", aiBinding: { ai: binding, kv}},
);
let text = "";
stream.on("text", (d) => { text += d;});
await stream.finalMessage();
assert.equal(text, "好");
assert.equal(captured.input.temperature, 0.85);
assert.equal(captured.input.top_p, 0.9);
assert.equal(captured.input.repetition_penalty, 1.1);
assert.equal(captured.input.stream, true);
} finally {
delete process.env.AI_TEMPERATURE;
}
});
