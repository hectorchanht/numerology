import { castHourCandidates } from "@numerology/engine";
import { streamHourInference, type ChatTurn } from "@numerology/ai";
import { parseHourInferInput } from "@/lib/birth";
import { ensureEnv } from "@/lib/env";
import { streamToPrimedResponse } from "@/lib/stream";
import { errorResponse } from "@/lib/http";
import { parseAi } from "@/lib/aiOpts";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/** 流式时辰推断对话:据已知人生事实比对 12 时辰命盘,反推最可能时辰。首 token 前失败 → JSON 错误(502),而非截断流。 */
export async function POST(req: Request): Promise<Response> {
  try {
    await ensureEnv();
    const body = (await req.json()) as {
      input?: unknown;
      history?: ChatTurn[];
      message?: unknown;
      ai?: unknown;
    };
    const input = parseHourInferInput(body.input);
    const message = typeof body.message === "string" ? body.message : "";
    const history = Array.isArray(body.history) ? body.history.slice(-16) : [];
    const candidates = castHourCandidates(input);
    return await streamToPrimedResponse(streamHourInference(candidates, history, message, { ai: parseAi(body) }));
  } catch (err) {
    return errorResponse(err, { fallback: "时辰推断失败", stage: "ai" });
  }
}
