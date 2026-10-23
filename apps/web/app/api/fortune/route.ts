import { castChart, analyzeFortune } from "@numerology/engine";
import { streamFortuneReport, streamFortuneSection, activeProviderName } from "@numerology/ai";
import { parseBirthInput } from "@/lib/birth";
import { ensureEnv } from "@/lib/env";
import { streamToPrimedResponse } from "@/lib/stream";
import { primeTimeoutMs } from "@/lib/primeTimeout";
import { errorResponse } from "@/lib/http";
import { resolveServerAi } from "@/lib/aiOpts";
import { prepareCachedStream, type KvLike } from "@/lib/aiCache";
import { stableInputHash, sha256hex } from "@/lib/hash";
import { getServerAiBindings, getWaitUntil } from "@/lib/aiBinding";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/** 流式生成《大运流年深析》(八字 × 紫微合参,逐步逐年)。首 token 前失败 → JSON 错误(502),而非截断流。 */
export async function POST(req: Request): Promise<Response> {
  try {
    await ensureEnv();
    const body = (await req.json()) as { input?: unknown; ai?: unknown; section?: unknown; lens?: unknown; locale?: unknown };
    const input = parseBirthInput(body.input);
    const chart = castChart(input);
    const fortune = analyzeFortune(input, { yearsBack: 5, yearsAhead: 8 });
    const ai = resolveServerAi(body);
    const section = typeof body.section === "string" && body.section.trim() ? body.section.trim() : undefined;
    const lens = body.lens === "bazi" || body.lens === "ziwei" ? body.lens : "both";
    const locale = body.locale === "zhs" || body.locale === "en" ? body.locale : "zht";
    // AI 响应缓存:同一输入+同一配置直接复用 KV 中的上次结果,不再烧预算。
    const kv = (getServerAiBindings()?.kv ?? null) as KvLike | null;
    const cached = await prepareCachedStream(
      kv,
      {
        provider: activeProviderName(ai),
        model: ai?.model?.trim() ?? "",
        locale,
        lens,
        section,
        inputHash: await stableInputHash(input as unknown as Record<string, unknown>),
        promptHash: await sha256hex((ai?.customSystemPrompt ?? "").trim()),
      },
      () =>
        section
          ? streamFortuneSection(chart, section, { fortune, ai, lens, locale })
          : streamFortuneReport(chart, { fortune, ai, locale }),
    );
    if ("hit" in cached) return cached.hit;
    // section 存在 → 只生成该节(分段模式,每节 <60s);缺省 → 整篇(CLI 兼容)。
    const resp = await streamToPrimedResponse(cached.miss.stream, primeTimeoutMs(ai));
    resp.headers.set("X-Cache", "MISS");
    cached.miss.armPersistence(getWaitUntil());
    return resp;
  } catch (err) {
    return errorResponse(err, { fallback: "大运流年深析生成失败", stage: "ai" });
  }
}
