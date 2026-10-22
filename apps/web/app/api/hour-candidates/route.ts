import { castHourCandidates } from "@numerology/engine";
import { parseHourInferInput } from "@/lib/birth";
import { errorResponse } from "@/lib/http";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/** 返回某日 12 时辰的候选命盘区分特征(确定性,无 AI)。 */
export async function POST(req: Request): Promise<Response> {
  try {
    const input = parseHourInferInput(await req.json());
    return Response.json({ candidates: castHourCandidates(input) });
  } catch (err) {
    return errorResponse(err, { fallback: "候选生成失败", stage: "input" });
  }
}
