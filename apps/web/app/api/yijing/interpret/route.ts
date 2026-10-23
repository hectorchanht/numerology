import { chatStream, type ProviderOptions } from "@numerology/ai";
import { castYijing } from "@numerology/engine";
import { getHexagram, yaoName } from "@numerology/knowledge";
import { ensureEnv } from "@/lib/env";
import { streamToPrimedResponse } from "@/lib/stream";
import { primeTimeoutMs } from "@/lib/primeTimeout";
import { errorResponse } from "@/lib/http";
import { prepareCachedStream, type KvLike } from "@/lib/aiCache";
import { sha256hex } from "@/lib/hash";
import { getServerAiBindings, getWaitUntil } from "@/lib/aiBinding";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/** prompt 版本:改 prompt 即換緩存鍵,不串味。 */
const PROMPT_VERSION = "yijing-interpret/v1";

const SYS_ZHT = `你是易經解卦助手。只根據下面給出的卦爻辭解讀,不編造經文原文,不預言具體事件。
輸出繁體中文,400字以內,分兩段:第一段第一句先給結論(此卦對所問之事的總定性,直接敢斷),再講啟示;第二段給一條可執行的建議。
嚴格區分「卦象顯示的傾向」(可肯定)與「具體事件」(不可編造)。`;

function buildUserText(hexNum: number, lines: number[], locale: string): string {
  const ben = getHexagram(hexNum)!;
  const changing = lines
    .map((v, i) => (v === 6 || v === 9 ? i + 1 : -1))
    .filter((p) => p > 0);
  const parts = [
    `本卦:${ben.symbol}${ben.name}(第${ben.number}卦)`,
    `卦辭:${ben.judgment}`,
  ];
  if (changing.length > 0) {
    const cast = castYijing(lines as [number, number, number, number, number, number]);
    const bian = cast.changed ? getHexagram(cast.changed) : undefined;
    for (const p of changing) {
      parts.push(`動爻${yaoName(ben, p)}:${ben.lines[p - 1]}`);
    }
    if (bian) parts.push(`變卦:${bian.symbol}${bian.name},卦辭:${bian.judgment}`);
  } else {
    parts.push("無動爻。");
  }
  parts.push(
    locale === "en"
      ? "Interpret this casting for the asker's situation in English, within 400 words."
      : "請解讀此卦,400字以內。",
  );
  return parts.join("\n");
}

/**
 * POST /api/yijing/interpret — AI 解卦(短解讀)。
 * 強制走 Workers AI binding,與報告路由共用同一個 $2/月 KV 預算守衛
 * (超支 → 乾淨 JSON 429,不燒錢);命中 KV 緩存則零消耗。
 * 注意:不接收用戶問題原文(問題只存於前端,不上傳)。
 */
export async function POST(req: Request): Promise<Response> {
  try {
    await ensureEnv();
    const body = (await req.json()) as { hexagram?: unknown; lines?: unknown; locale?: unknown };
    const hexNum = body.hexagram;
    const lines = body.lines;
    const locale = body.locale === "zhs" || body.locale === "en" ? body.locale : "zht";
    if (typeof hexNum !== "number" || !Number.isInteger(hexNum) || hexNum < 1 || hexNum > 64) {
      throw new Error("非法請求: hexagram 須為 1–64 的整數");
    }
    if (
      !Array.isArray(lines) ||
      lines.length !== 6 ||
      !lines.every((v) => v === 6 || v === 7 || v === 8 || v === 9)
    ) {
      throw new Error("非法請求: lines 須為 6 個爻值(6/7/8/9)");
    }
    const ben = getHexagram(hexNum);
    if (!ben) throw new Error("非法請求: 找不到該卦");
    // 以引擎重算為準,不信任客戶端傳的 hexagram
    const cast = castYijing(lines as [number, number, number, number, number, number]);
    const realHex = getHexagram(cast.hexagram)!;

    const ai: ProviderOptions = {
      provider: "workers-ai",
      aiBinding: getServerAiBindings() ?? undefined,
    };
    const kv = (getServerAiBindings()?.kv ?? null) as KvLike | null;
    const userText = buildUserText(realHex.number, lines as number[], locale);
    const cached = await prepareCachedStream(
      kv,
      {
        provider: "workers-ai",
        model: "",
        locale,
        lens: "",
        section: "yijing-interpret",
        inputHash: await sha256hex(JSON.stringify({ h: realHex.number, l: lines })),
        promptHash: await sha256hex(PROMPT_VERSION),
      },
      () =>
        chatStream(
          {
            system: [{ text: SYS_ZHT }],
            messages: [{ role: "user", content: userText }],
            maxTokens: 900,
            kind: "chat",
          },
          ai,
        ),
    );
    if ("hit" in cached) return cached.hit;
    const resp = await streamToPrimedResponse(cached.miss.stream, primeTimeoutMs(ai));
    resp.headers.set("X-Cache", "MISS");
    cached.miss.armPersistence(getWaitUntil());
    return resp;
  } catch (err) {
    return errorResponse(err, { fallback: "AI 解卦失敗", stage: "ai" });
  }
}
