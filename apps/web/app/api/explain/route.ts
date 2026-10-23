import { chatComplete, type ProviderOptions } from "@numerology/ai";
import { ensureEnv } from "@/lib/env";
import { errorResponse } from "@/lib/http";
import { getServerAiBindings } from "@/lib/aiBinding";
import { sha256hex } from "@/lib/hash";
import { AI_CACHE_TTL_SECONDS, type KvLike } from "@/lib/aiCache";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/** prompt 版本:改 prompt 即換緩存鍵,不串味。 */
const PROMPT_VERSION = "explain/v1";
const MAX_TEXT_LEN = 40;

const SYS: Record<string, string> = {
  zht: `你是命理/易經小助手。用戶在閱讀時選取了一個詞語,請用白話解釋它在命理或易經語境下的意思。要求:兩三句、150字以內,說人話,術語第一次出現就當場用白話註解,唔好展開成大篇報告,唔好預測具體事件。`,
  zhs: `你是命理/易经小助手。用户在阅读时选取了一个词语,请用白话解释它在命理或易经语境下的意思。要求:两三句、150字以内,说人话,术语第一次出现就当场用白话注解,不要展开成大篇报告,不要预测具体事件。`,
  en: `You are a Chinese metaphysics / Yijing assistant. The user highlighted a term while reading. Explain what it means in a Chinese-metaphysics or Yijing context, in plain language: two or three sentences, under 120 words, no long report, no predictions of specific events.`,
};

/**
 * POST /api/explain — 選詞 AI 解釋(短答案,非流式)。
 * 強制走 Workers AI,與報告路由共用同一個 $2/月 KV 預算守衛
 * (超支 → 乾淨 JSON 429,不燒錢);命中 KV 緩存則零消耗。
 * 選取文字限 2–40 字,防止濫用。
 */
export async function POST(req: Request): Promise<Response> {
  try {
    await ensureEnv();
    const body = (await req.json()) as { text?: unknown; locale?: unknown };
    const text = typeof body.text === "string" ? body.text.trim() : "";
    const locale = body.locale === "zhs" || body.locale === "en" ? body.locale : "zht";
    if (!text || text.length < 2) throw new Error("請選取至少兩個字");
    if (text.length > MAX_TEXT_LEN) throw new Error("選取文字過長,請縮短至 40 字內");

    const kv = (getServerAiBindings()?.kv ?? null) as KvLike | null;
    const cacheKey = `explain:1:${await sha256hex(`${PROMPT_VERSION}|${locale}|${text}`)}`;
    if (kv) {
      try {
        const hit = await kv.get(cacheKey);
        if (hit) return Response.json({ answer: hit, cached: true });
      } catch {
        /* 讀失敗按 miss 處理 */
      }
    }

    const ai: ProviderOptions = {
      provider: "workers-ai",
      aiBinding: getServerAiBindings() ?? undefined,
    };
    const { text: answer } = await chatComplete(
      {
        kind: "chat",
        maxTokens: 400,
        system: [{ text: SYS[locale] ?? SYS.zht }],
        messages: [{ role: "user", content: `解釋「${text}」是什麼意思。` }],
      },
      ai,
    );
    const out = answer.trim();
    if (kv && out) {
      try {
        await kv.put(cacheKey, out, { expirationTtl: AI_CACHE_TTL_SECONDS });
      } catch {
        /* 寫入失敗不影響已返回的響應 */
      }
    }
    return Response.json({ answer: out });
  } catch (err) {
    return errorResponse(err, { fallback: "AI 解釋失敗", stage: "ai" });
  }
}
