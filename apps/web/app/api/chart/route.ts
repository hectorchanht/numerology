import { castChart, analyzeFortune } from "@numerology/engine";
import { parseBirthInput } from "@/lib/birth";
import { errorResponse } from "@/lib/http";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/** 排盤:出生信息 → 八字+紫微雙盤 + 動態運勢。確定性,不調 AI。 */
export async function POST(req: Request): Promise<Response> {
  try {
    const input = parseBirthInput(await req.json());
    const chart = castChart(input);
    const fortune = analyzeFortune(input, { yearsAhead: 8 });
    return Response.json({ chart, fortune });
  } catch (err) {
    return errorResponse(err, { fallback: "排盘失败", stage: "input" });
  }
}
