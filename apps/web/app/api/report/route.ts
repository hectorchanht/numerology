import { castChart, analyzeFortune } from "@numerology/engine";
import { streamReport, streamReportSection, activeProviderName } from "@numerology/ai";
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
 * v4 = 2026-10-23 v3.1 targeted fixes:TL;DR 禁列歲數年份干支、陳腔 ban list 擴充(與 fortune/v4 同步)。
 * v5 = 2026-10-23 context-trim:分節生成各節只喂當前運一行(原來整份 fortune),
 * 整篇模式保持 full;prompt 指令文字不變。
 * v6 = 2026-11-02 思考捕捉:開啟 captureThinking(思考分流呈現,不再壓制)——
 * 生成行為變了,且 v5 緩存裡有 qwen3:30b 等模型在壓制下寫進正文的規劃獨白
 * (無標記、事後無法可靠分拆),必須靠版本號整體失效。
 * v7 = 2026-11-02 harmony 正規化:provider 補上 gpt-oss harmony channel 拆分
 * (mlx-lm 原始標記);v6 緩存裡 MLX gpt-oss 的未正規化原文必須失效。
 * v8 = 2026-11-04 人設擴為多體系、新增 crosssystem 節。
 * v9 = 2026-11-05 crosssystem 節事實加「數之學」(你的數、律呂、黃道、Behenian 恆星)與基率指令。
 */
const PROMPT_VERSION = "report/v9";

/** 流式生成命盤解讀報告(動靜結合)。首 token 前失敗 → JSON 錯誤(502),而非截斷流。 */
export async function POST(req: Request): Promise<Response> {
  try {
    await ensureEnv();
    const body = (await req.json()) as { input?: unknown; ai?: unknown; section?: unknown; lens?: unknown; locale?: unknown; fresh?: unknown };
    const input = parseBirthInput(body.input);
    const chart = castChart(input);
    const fortune = analyzeFortune(input, { yearsBack: 5, yearsAhead: 8 });
    // 報告路徑開啟思考捕捉(Hector 2026-11-02):思考過程分流到 <think> 段
    // 供前端摺疊呈現,不再壓制 reasoning。chat 等其它路徑不開,維持原行為。
    const ai = { ...resolveServerAi(body), captureThinking: true };
    const section = typeof body.section === "string" && body.section.trim() ? body.section.trim() : undefined;
    // 多體系一節不受 lens 隔離 → 一律 "both",避免同內容因 lens 不同而分裂快取。
    const lens = section !== "crosssystem" && (body.lens === "bazi" || body.lens === "ziwei") ? body.lens : "both";
    const locale = body.locale === "zhs" || body.locale === "en" ? body.locale : "zht";
    // AI 響應緩存:同一輸入+同一配置直接複用 KV 中的上次結果,不再燒預算。
    // 鍵含 provider/model/locale/lens/section/輸入哈希/人設哈希;只緩存完整成功的響應。
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
          ? streamReportSection(chart, section, { fortune, ai, lens, locale })
          : streamReport(chart, { fortune, ai, locale }),
      await scriptLocker(locale),
      body.fresh === true,
    );
    if ("hit" in cached) return cached.hit;
    // section 存在 → 只生成該節(分段模式,每節 <60s,繞開 Vercel 函數上限);缺省 → 整篇(CLI 兼容)。
    const resp = await streamToPrimedResponse(cached.miss.stream, primeTimeoutMs(ai));
    resp.headers.set("X-Cache", "MISS");
    cached.miss.armPersistence(getWaitUntil());
    return resp;
  } catch (err) {
    return errorResponse(err, { fallback: "报告生成失败", stage: "ai" });
  }
}
