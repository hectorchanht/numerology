const STREAM_HEADERS = {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Accel-Buffering": "no",
};
/** 把 SDK 文本流转成纯文本的流式 HTTP 响应,供前端逐字渲染。 */
export function streamToResponse(stream) {
    const encoder = new TextEncoder();
    const body = new ReadableStream({
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
 * 带"预热"的流式响应:先等第一个文本块(或失败),超时前拿到才返回 Response。
 *
 * 背景:直接 streamToResponse 会立刻发送 HTTP 头;若 provider 在首 token 前就失败
 * (限流/坏 key/DNS),客户端只能看到一条被静默截断的流,无法得知出错。
 * 预热后:失败发生在返回 Response 之前,调用方可直接返回 JSON 错误(含正确状态码)。
 *
 * @param timeoutMs 等待首个文本块的最长毫秒数,默认 20000。
 * @throws provider 在首 token 前抛出的原始错误(由调用方按 http.ts 分类)。
 */
export async function streamToPrimedResponse(stream, timeoutMs = 20_000) {
    const first = await waitForFirstChunk(stream, timeoutMs);
    const encoder = new TextEncoder();
    const body = new ReadableStream({
        start(controller) {
            // 预热时已消费掉首个块,这里先回放,保证正文完整。
            if (first)
                controller.enqueue(encoder.encode(first));
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
/** 等待流的第一个文本块;出错(含超时)直接抛给调用方。 */
function waitForFirstChunk(stream, timeoutMs) {
    return new Promise((resolve, reject) => {
        let settled = false;
        const done = (fn) => {
            if (settled)
                return;
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
