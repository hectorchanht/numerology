import { analyzeFortune } from "@numerology/engine";
import { parseBirthInput } from "@/lib/birth";
import { errorResponse } from "@/lib/http";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * 确定性运势数据(JSON,无 AI 调用):供前端在渲染前对报告文本做
 * 确定性修复(小标题数字、紫微大限:無)。同样修复 KV/历史记录里的旧占位文本。
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
