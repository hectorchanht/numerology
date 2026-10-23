import { castChart, analyzeFortune } from "@numerology/engine";
import { streamFollowUp, type ChatTurn } from "@numerology/ai";
import { parseBirthInput } from "@/lib/birth";
import { ensureEnv } from "@/lib/env";
import { streamToPrimedResponse } from "@/lib/stream";
import { errorResponse } from "@/lib/http";
import { resolveServerAi } from "@/lib/aiOpts";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/** 流式对话追问(复用同一命盘 + 动态运势的缓存上下文)。首 token 前失败 → JSON 错误(502),而非截断流。 */
export async function POST(req: Request): Promise<Response> {
  try {
    await ensureEnv();
    const body = (await req.json()) as {
      input?: unknown;
      history?: ChatTurn[];
      question?: unknown;
      ai?: unknown;
      locale?: unknown;
    };
    const input = parseBirthInput(body.input);
    const question = typeof body.question === "string" ? body.question.trim() : "";
    if (!question) throw new Error("追问内容不能为空");
    const history = Array.isArray(body.history) ? body.history.slice(-12) : [];
    const locale = body.locale === "zhs" || body.locale === "en" ? body.locale : "zht";

    const chart = castChart(input);
    const fortune = analyzeFortune(input, { yearsBack: 5, yearsAhead: 8 });
    return await streamToPrimedResponse(streamFollowUp(chart, history, question, { fortune, ai: resolveServerAi(body), locale }));
  } catch (err) {
    return errorResponse(err, { fallback: "对话失败", stage: "ai" });
  }
}
