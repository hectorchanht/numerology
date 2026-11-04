import { analyzeFortune } from "@numerology/engine";
import { parseBirthInput } from "@/lib/birth";
import { errorResponse } from "@/lib/http";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * 確定性運勢數據(JSON,無 AI 調用):供前端在渲染前對報告文本做
 * 確定性修復(小標題數字、紫微大限:無)。同樣修復 KV/歷史記錄裏的舊佔位文本。
 */
export async function POST(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as { input?: unknown };
    const input = parseBirthInput(body.input);
    const fortune = analyzeFortune(input, { yearsBack: 5, yearsAhead: 8 });
    return Response.json({ fortune });
  } catch (err) {
    return errorResponse(err, { fallback: "运势数据计算失败", stage: "input" });
  }
}
