import { castHourCandidates } from "@numerology/engine";
import { streamHourInference, type ChatTurn } from "@numerology/ai";
import { parseHourInferInput } from "@/lib/birth";
import { ensureEnv } from "@/lib/env";
import { streamToPrimedResponse } from "@/lib/stream";
import { primeTimeoutMs } from "@/lib/primeTimeout";
import { errorResponse } from "@/lib/http";
import { resolveServerAi } from "@/lib/aiOpts";
import { lockTextStream, scriptLocker } from "@/lib/script";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/** 流式時辰推斷對話:據已知人生事實比對 12 時辰命盤,反推最可能時辰。首 token 前失敗 → JSON 錯誤(502),而非截斷流。 */
export async function POST(req: Request): Promise<Response> {
  try {
    await ensureEnv();
    const body = (await req.json()) as {
      input?: unknown;
      history?: ChatTurn[];
      message?: unknown;
      ai?: unknown;
      locale?: unknown;
    };
    const input = parseHourInferInput(body.input);
    const message = typeof body.message === "string" ? body.message : "";
    const history = Array.isArray(body.history) ? body.history.slice(-16) : [];
    const candidates = castHourCandidates(input);
    const locale = body.locale === "zhs" || body.locale === "en" ? body.locale : "zht";
    const ai = resolveServerAi(body);
    const stream = lockTextStream(streamHourInference(candidates, history, message, { ai, locale }), await scriptLocker(locale));
    return await streamToPrimedResponse(stream, primeTimeoutMs(ai));
  } catch (err) {
    return errorResponse(err, { fallback: "时辰推断失败", stage: "ai" });
  }
}
