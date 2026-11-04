/**
 * 客戶端:POST 一個請求並流式接收文本。
 * 回調傳【累計全文】(非增量),且做時間節流——避免長文本下每個 token 都觸發
 * Markdown 重解析(O(n²) 卡頓)。流結束時保證用最終全文回調一次。
 */
export async function streamPost(
  url: string,
  body: unknown,
  onText: (fullText: string) => void,
  opts: { throttleMs?: number; signal?: AbortSignal } = {},
): Promise<void> {
  const throttleMs = opts.throttleMs ?? 80;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: opts.signal,
  });
  if (!res.ok || !res.body) {
    const err = (await res.json().catch(() => null)) as { error?: string; code?: string } | null;
    // code 隨錯誤透出(如 MODEL_NOT_FOUND),調用方可據此做緩存清理等動作。
    const e = new Error(err?.error ?? `请求失败(${res.status})`) as Error & { code?: string };
    if (err?.code) e.code = err.code;
    throw e;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  let last = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    full += decoder.decode(value, { stream: true });
    const now = Date.now();
    if (now - last >= throttleMs) {
      last = now;
      onText(full);
    }
  }
  onText(full); // 最終全文,保證不丟尾部
}
