import { castChart, analyzeFortune } from "@numerology/engine";
import { streamReport, streamReportSection } from "@numerology/ai";
import { parseBirthInput } from "@/lib/birth";
import { ensureEnv } from "@/lib/env";
import { streamToPrimedResponse } from "@/lib/stream";
import { errorResponse } from "@/lib/http";
import { parseAi } from "@/lib/aiOpts";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/** 流式生成命盘解读报告(动静结合)。首 token 前失败 → JSON 错误(502),而非截断流。 */
export async function POST(req: Request): Promise<Response> {
  try {
    await ensureEnv();
    const body = (await req.json()) as { input?: unknown; ai?: unknown; section?: unknown; lens?: unknown };
    const input = parseBirthInput(body.input);
    const chart = castChart(input);
    const fortune = analyzeFortune(input, { yearsBack: 5, yearsAhead: 8 });
    const ai = parseAi(body);
    const section = typeof body.section === "string" && body.section.trim() ? body.section.trim() : undefined;
    const lens = body.lens === "bazi" || body.lens === "ziwei" ? body.lens : "both";
    // section 存在 → 只生成该节(分段模式,每节 <60s,绕开 Vercel 函数上限);缺省 → 整篇(CLI 兼容)。
    const stream = section
      ? streamReportSection(chart, section, { fortune, ai, lens })
      : streamReport(chart, { fortune, ai });
    return await streamToPrimedResponse(stream);
  } catch (err) {
    return errorResponse(err, { fallback: "报告生成失败", stage: "ai" });
  }
}
