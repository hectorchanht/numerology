/** Anthropic MessageStream 的最小接口(只用到這幾個成員)。 */
interface TextMessageStream {
  on(event: "text", listener: (delta: string) => void): unknown;
  on(event: "error", listener: (err: unknown) => void): unknown;
  finalMessage(): Promise<unknown>;
  abort(): void;
}

const STREAM_HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Accel-Buffering": "no",
};

/** 把 SDK 文本流轉成純文本的流式 HTTP 響應,供前端逐字渲染。 */
export function streamToResponse(stream: TextMessageStream): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      stream.on("text", (delta) => controller.enqueue(encoder.encode(delta)));
      stream.on("error", (err) => controller.error(err));
      stream
        .finalMessage()
        .then(() => controller.close())
        .catch((err) => controller.error(err));
    },
    cancel() {
      stream.abort();
    },
  });
  return new Response(body, { headers: STREAM_HEADERS });
}

/**
 * 帶"預熱"的流式響應:先等第一個文本塊(或失敗),超時前拿到才返回 Response。
 *
 * 背景:直接 streamToResponse 會立刻發送 HTTP 頭;若 provider 在首 token 前就失敗
 * (限流/壞 key/DNS),客戶端只能看到一條被靜默截斷的流,無法得知出錯。
 * 預熱後:失敗發生在返回 Response 之前,調用方可直接返回 JSON 錯誤(含正確狀態碼)。
 *
 * @param timeoutMs 等待首個文本塊的最長毫秒數,默認 20000。
 * @throws provider 在首 token 前拋出的原始錯誤(由調用方按 http.ts 分類)。
 */
export async function streamToPrimedResponse(
  stream: TextMessageStream,
  timeoutMs = 20_000,
): Promise<Response> {
  const first = await waitForFirstChunk(stream, timeoutMs);
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      // 預熱時已消費掉首個塊,這裡先回放,保證正文完整。
      if (first) controller.enqueue(encoder.encode(first));
      stream.on("text", (delta) => controller.enqueue(encoder.encode(delta)));
      stream.on("error", (err) => controller.error(err));
      stream
        .finalMessage()
        .then(() => controller.close())
        .catch((err) => controller.error(err));
    },
    cancel() {
      stream.abort();
    },
  });
  return new Response(body, { headers: STREAM_HEADERS });
}

/** 等待流的第一個文本塊;出錯(含超時)直接拋給調用方。 */
function waitForFirstChunk(stream: TextMessageStream, timeoutMs: number): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    let settled = false;
    const done = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn();
    };
    const timer = setTimeout(() => {
      done(() => reject(new Error(`AI 请求超时:${Math.round(timeoutMs / 1000)}s 内未收到首个文本块`)));
    }, timeoutMs);
    stream.on("text", (delta) => done(() => resolve(delta)));
    stream.on("error", (err) => done(() => reject(err)));
    stream
      .finalMessage()
      .then(() => done(() => resolve("")))
      .catch((err) => done(() => reject(err)));
  });
}
