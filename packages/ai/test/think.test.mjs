import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

// —— 思考正規化(2026-11-02,Hector 拍板:思考唔剝走,捕捉後俾前端折疊展示)——
// capture 開:結構化 reasoning + content 內嵌 <think> 段 → 統一 <think>…</think> 文本段。
// capture 關(預設):reasoning 丟棄 + 內嵌段剝除,其它文本零影響。

const { ThinkStreamNormalizer, normalizeThinkText } = await import("../dist/provider.js");

function runNorm(capture, ops) {
  const n = new ThinkStreamNormalizer(capture);
  let out = "";
  for (const [kind, s] of ops) out += kind === "r" ? n.pushReasoning(s) : n.pushContent(s);
  return out + n.finish();
}

test("think:capture 開——reasoning 段先行,正文到達自動閉合", () => {
  const out = runNorm(true, [["r", "先諗"], ["r", "一諗"], ["c", "## 標題"], ["c", "\n正文"]]);
  assert.equal(out, "<think>先諗一諗</think>## 標題\n正文");
});

test("think:capture 開——content 內嵌標籤原樣保留(標籤跨 chunk 切分)", () => {
  const out = runNorm(true, [["c", "<thi"], ["c", "nk>內嵌</th"], ["c", "ink>正文"]]);
  assert.equal(out, "<think>內嵌</think>正文");
});

test("think:capture 開——未閉合 think 在 finish 補閉合", () => {
  const out = runNorm(true, [["r", "諗到一半"]]);
  assert.equal(out, "<think>諗到一半</think>");
});

test("think:capture 關——reasoning 丟棄 + 內嵌段剝除", () => {
  const out = runNorm(false, [["r", "唔好出嚟"], ["c", "前<think>秘密</think>後"]]);
  assert.equal(out, "前後");
});

test("think:capture 關——標籤跨 chunk 一樣剝得乾淨", () => {
  const out = runNorm(false, [["c", "甲<th"], ["c", "ink>乙</thi"], ["c", "nk>丙"]]);
  assert.equal(out, "甲丙");
});

test("think:冇標籤普通文本逐字零影響(開/關皆然)", () => {
  const plain = "## 性格特質\nTL;DR:直接。\n\n正文 <b>唔係</b> think 標籤 > <。";
  assert.equal(runNorm(true, [["c", plain]]), plain);
  assert.equal(runNorm(false, [["c", plain]]), plain);
});

test("think:正文在前、think 在中——capture 開保留原位(前端 splitter 會抽走摺埋)", () => {
  const out = runNorm(true, [["c", "前文<think>中段諗</think>後文"]]);
  assert.equal(out, "前文<think>中段諗</think>後文");
});

test("think:normalizeThinkText 非流式——reasoning 欄併入", () => {
  assert.equal(normalizeThinkText("正文", "諗過", true), "<think>諗過</think>正文");
  assert.equal(normalizeThinkText("正文", "諗過", false), "正文");
  assert.equal(normalizeThinkText("甲<think>乙</think>丙", undefined, true), "甲<think>乙</think>丙");
  assert.equal(normalizeThinkText("甲<think>乙</think>丙", undefined, false), "甲丙");
});

// —— chatStream 層:mock Ollama 形狀 SSE(reasoning 獨立欄 + content)——

function startThinkMock() {
  const seen = { bodies: [] };
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      if (req.url.endsWith("/chat/completions") && req.method === "POST") {
        seen.bodies.push(JSON.parse(body || "{}"));
        res.writeHead(200, { "Content-Type": "text/event-stream" });
        const chunk = (delta) =>
          `data: ${JSON.stringify({ id: "1", object: "chat.completion.chunk", choices: [{ index: 0, delta, finish_reason: null }] })}\n\n`;
        res.end(
          chunk({ role: "assistant", content: "", reasoning: "諗" }) +
            chunk({ content: "", reasoning: "諗" }) +
            chunk({ content: "## 性格特質" }) +
            chunk({ content: "\n正文" }) +
            "data: [DONE]\n\n",
        );
        return;
      }
      res.writeHead(404);
      res.end();
    });
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({ server, seen, port: server.address().port }));
  });
}

async function collectStream(opts, port, tag) {
  const { chatStream } = await import(`../dist/provider.js?${tag}`);
  const stream = chatStream(
    { kind: "report", maxTokens: 500, system: [{ text: "s" }], messages: [{ role: "user", content: "hi" }] },
    { provider: "mac-llm", model: "qwen3:8b", baseURL: `http://127.0.0.1:${port}/v1`, ...opts },
  );
  let out = "";
  stream.on("text", (d) => (out += d));
  const fin = await stream.finalMessage();
  return { out, finText: fin.text };
}

test("think:chatStream capture 開——reasoning 成 think 段,且唔送 reasoning_effort", async () => {
  const { server, seen, port } = await startThinkMock();
  try {
    const { out, finText } = await collectStream({ captureThinking: true }, port, "cap-on");
    assert.equal(out, "<think>諗諗</think>## 性格特質\n正文");
    assert.equal(finText, out);
    assert.equal(seen.bodies.length, 1);
    assert.ok(!("reasoning_effort" in seen.bodies[0]), "capture 開唔應該壓制思考");
  } finally {
    server.close();
  }
});

test("think:chatStream capture 關(預設)——reasoning 丟棄,且送 reasoning_effort:none 壓制", async () => {
  const { server, seen, port } = await startThinkMock();
  try {
    const { out } = await collectStream({}, port, "cap-off");
    assert.equal(out, "## 性格特質\n正文");
    assert.equal(seen.bodies[0].reasoning_effort, "none");
  } finally {
    server.close();
  }
});

function feedAll(capture, raw) {
  return runNorm(capture, [["c", raw]]);
}

test("harmony:capture 開——analysis channel 歸 think,final 係正文,標記全清", () => {
  const raw =
    "<|channel|>analysis<|message|>諗緊點寫呢節。<|end|><|start|>assistant<|channel|>final<|message|>## 性格特質\n正文。<|end|>";
  assert.equal(
    feedAll(true, raw),
    "<think>諗緊點寫呢節。</think>## 性格特質\n正文。",
  );
});

test("harmony:capture 關——analysis 整段剝除,只剩 final 正文", () => {
  const raw =
    "<|channel|>analysis<|message|>諗緊點寫呢節。<|end|><|start|>assistant<|channel|>final<|message|>## 性格特質\n正文。<|end|>";
  assert.equal(feedAll(false, raw), "## 性格特質\n正文。");
});

test("harmony:標記跨 chunk 切分(逐字餵)結果不變", () => {
  const raw =
    "<|channel|>analysis<|message|>諗嘢<|end|><|start|>assistant<|channel|>final<|message|>正文";
  const n = new ThinkStreamNormalizer(true);
  let out = "";
  for (const ch of raw) out += n.pushContent(ch);
  out += n.finish();
  assert.equal(out, "<think>諗嘢</think>正文");
});

test("harmony:流尾未成形標記碎片丟棄,唔漏入正文", () => {
  assert.equal(feedAll(true, "正文完。<|en"), "正文完。");
  assert.equal(feedAll(false, "正文完。<|channel|>ana"), "正文完。");
});
