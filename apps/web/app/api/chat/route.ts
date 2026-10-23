import { castChart, analyzeFortune } from "@numerology/engine";
import { streamFollowUp, activeProviderName, type ChatTurn } from "@numerology/ai";
import { parseBirthInput } from "@/lib/birth";
import { ensureEnv } from "@/lib/env";
import { streamToPrimedResponse } from "@/lib/stream";
import { primeTimeoutMs } from "@/lib/primeTimeout";
import { errorResponse } from "@/lib/http";
import { resolveServerAi } from "@/lib/aiOpts";
import { prepareCachedStream, type KvLike } from "@/lib/aiCache";
import { sha256hex } from "@/lib/hash";
import { getServerAiBindings, getWaitUntil } from "@/lib/aiBinding";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/** prompt 版本:改動追問 prompt 即換緩存鍵,不串味。 */
const CHAT_PROMPT_VERSION = "chat/v1";

/**
 * 流式对话追问(复用同一命盘 + 动态运势的缓存上下文)。
 * KV 緩存(命盤 + 歷史 + 問題 + 人設):重複問即零消耗命中,不燒 AI 額度。
 * 首 token 前失败 → JSON 错误(502),而非截断流。
 */
export async function POST(req: Request): Promise<Response> {
  try {
    await ensureEnv();
    const body = (await req.json()) as {
      input?: unknown;
      history?: ChatTurn[];
      question?: unknown;
      ai?: unknown;
      locale?: unknown;
      systemPrompt?: unknown;
    };
    const input = parseBirthInput(body.input);
    const question = typeof body.question === "string" ? body.question.trim() : "";
    if (!question) throw new Error("追问内容不能为空");
    const history = Array.isArray(body.history) ? body.history.slice(-12) : [];
    const locale = body.locale === "zhs" || body.locale === "en" ? body.locale : "zht";
    const customPrompt = typeof body.systemPrompt === "string" ? body.systemPrompt : "";

    const chart = castChart(input);
    const fortune = analyzeFortune(input, { yearsBack: 5, yearsAhead: 8 });
    const ai = resolveServerAi(body);
    const kv = (getServerAiBindings()?.kv ?? null) as KvLike | null;
    const cached = await prepareCachedStream(
      kv,
      {
        provider: activeProviderName(ai),
        model: "",
        locale,
        section: "chat",
        inputHash: await sha256hex(JSON.stringify({ i: input, h: history, q: question })),
        promptHash: await sha256hex(`${CHAT_PROMPT_VERSION}|${customPrompt}`),
      },
      () => streamFollowUp(chart, history, question, { fortune, ai, locale }),
    );
    if ("hit" in cached) return cached.hit;
    const resp = await streamToPrimedResponse(cached.miss.stream, primeTimeoutMs(ai));
    resp.headers.set("X-Cache", "MISS");
    cached.miss.armPersistence(getWaitUntil());
    return resp;
  } catch (err) {
    return errorResponse(err, { fallback: "对话失败", stage: "ai" });
  }
}
