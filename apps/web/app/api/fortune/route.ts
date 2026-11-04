import { castChart, analyzeFortune } from "@numerology/engine";
import { streamFortuneReport, streamFortuneSection, activeProviderName } from "@numerology/ai";
import { parseBirthInput } from "@/lib/birth";
import { ensureEnv } from "@/lib/env";
import { streamToPrimedResponse } from "@/lib/stream";
import { primeTimeoutMs } from "@/lib/primeTimeout";
import { errorResponse } from "@/lib/http";
import { resolveServerAi } from "@/lib/aiOpts";
import { prepareCachedStream, type KvLike } from "@/lib/aiCache";
import { scriptLocker } from "@/lib/script";
import { stableInputHash, sha256hex } from "@/lib/hash";
import { getServerAiBindings, getWaitUntil } from "@/lib/aiBinding";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * prompt 版本:改 prompt 即換緩存鍵,不串味。
 * v4 = 2026-10-23 v3.1 targeted fixes:TL;DR 禁列歲數年份干支(佔位符修復)、
 * 每步/每年只點 1–2 個最強信號、定性「起外號」具體化、同期大限稱謂統一、陳腔 ban list 擴充。
 * v5 = 2026-10-23 context-trim:分節生成按 FortuneScope 只喂該節需要的動態數據
 * (overview/action→current, dayun/rhythm→dayun+信號digest, review→已過年, future→未來年),
 * 整份 fortune 不再每節重倒;prompt 指令文字不變。
 * v6 = 2026-11-02 思考捕捉:與 report/v6 同步開啟 captureThinking——生成行為變了,
 * v5 緩存裡可能有壓制下寫進正文的規劃獨白(無標記、無法可靠分拆),整體失效。
 * v7 = 2026-11-02 harmony 正規化:與 report/v7 同步(provider 補 gpt-oss harmony
 * channel 拆分);v6 緩存裡 MLX gpt-oss 的未正規化原文必須失效。
 * v8 = 2026-11-04 人設擴為多體系。
 */
const PROMPT_VERSION = "fortune/v8";

/** 流式生成《大運流年深析》(八字 × 紫微合參,逐步逐年)。首 token 前失敗 → JSON 錯誤(502),而非截斷流。 */
export async function POST(req: Request): Promise<Response> {
  try {
    await ensureEnv();
    const body = (await req.json()) as { input?: unknown; ai?: unknown; section?: unknown; lens?: unknown; locale?: unknown };
    const input = parseBirthInput(body.input);
    const chart = castChart(input);
    const fortune = analyzeFortune(input, { yearsBack: 5, yearsAhead: 8 });
    // 深析路徑同報告開啟思考捕捉(Hector 2026-11-02):思考分流摺疊呈現,不壓制。
    const ai = { ...resolveServerAi(body), captureThinking: true };
    const section = typeof body.section === "string" && body.section.trim() ? body.section.trim() : undefined;
    const lens = body.lens === "bazi" || body.lens === "ziwei" ? body.lens : "both";
    const locale = body.locale === "zhs" || body.locale === "en" ? body.locale : "zht";
    // AI 響應緩存:同一輸入+同一配置直接複用 KV 中的上次結果,不再燒預算。
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
        promptHash: await sha256hex(`${PROMPT_VERSION}|${(ai?.customSystemPrompt ?? "").trim()}`),
      },
      () =>
        section
          ? streamFortuneSection(chart, section, { fortune, ai, lens, locale })
          : streamFortuneReport(chart, { fortune, ai, locale }),
      await scriptLocker(locale),
    );
    if ("hit" in cached) return cached.hit;
    // section 存在 → 只生成該節(分段模式,每節 <60s);缺省 → 整篇(CLI 兼容)。
    const resp = await streamToPrimedResponse(cached.miss.stream, primeTimeoutMs(ai));
    resp.headers.set("X-Cache", "MISS");
    cached.miss.armPersistence(getWaitUntil());
    return resp;
  } catch (err) {
    return errorResponse(err, { fallback: "大运流年深析生成失败", stage: "ai" });
  }
}
