import { chatStream, activeProviderName } from "@numerology/ai";
import { castYijing } from "@numerology/engine";
import { getHexagram, yaoName } from "@numerology/knowledge";
import { ensureEnv } from "@/lib/env";
import { streamToPrimedResponse } from "@/lib/stream";
import { primeTimeoutMs } from "@/lib/primeTimeout";
import { errorResponse } from "@/lib/http";
import { prepareCachedStream, type KvLike } from "@/lib/aiCache";
import { scriptLocker } from "@/lib/script";
import { sha256hex } from "@/lib/hash";
import { getServerAiBindings, getWaitUntil } from "@/lib/aiBinding";
import { resolveServerAi } from "@/lib/aiOpts";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/** prompt 版本:改 prompt 即換緩存鍵,不串味。v2:可選接收用戶問題(入緩存鍵)。 */
const PROMPT_VERSION = "yijing-interpret/v2";

const SYS_ZHT = `你是易經解卦助手。只根據下面給出的卦爻辭解讀,不編造經文原文,不預言具體事件。
輸出繁體中文,400字以內,分兩段:第一段第一句先給結論(此卦對所問之事的總定性,直接敢斷),再講啟示;第二段給一條可執行的建議。
嚴格區分「卦象顯示的傾向」(可肯定)與「具體事件」(不可編造)。`;

function buildUserText(hexNum: number, lines: number[], locale: string, question?: string): string {
  const ben = getHexagram(hexNum)!;
  const changing = lines
    .map((v, i) => (v === 6 || v === 9 ? i + 1 : -1))
    .filter((p) => p > 0);
  const parts = [
    `本卦:${ben.symbol}${ben.name}(第${ben.number}卦)`,
    `卦辭:${ben.judgment}`,
  ];
  // 用戶問題(選填):有就緊扣具體問題解讀,冇就通用解讀
  if (question) parts.push(`所問之事:${question}`);
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
 * 用戶可選 provider(經 AI 設定頁;請求體 `ai` 由 aiRequestParts() 帶上);
 * 冇帶就默認 Workers AI binding,與報告路由共用同一個 $2/月 KV 預算守衛
 * (超支 → 乾淨 JSON 429,不燒錢);命中 KV 緩存則零消耗。
 * 用戶自帶 key 的 provider 走自己的賬,不受 $2 守衛限制。
 * question 選填:用戶喺前端 toggle「AI 解卦時參考此問題」(default 開)
 * 先會送上嚟;唔送就通用解讀。有問題入緩存鍵,唔同問題唔串味。
 */
export async function POST(req: Request): Promise<Response> {
  try {
    await ensureEnv();
    const body = (await req.json()) as {
      hexagram?: unknown;
      lines?: unknown;
      locale?: unknown;
      question?: unknown;
    };
    const hexNum = body.hexagram;
    const lines = body.lines;
    const locale = body.locale === "zhs" || body.locale === "en" ? body.locale : "zht";
    // 問題選填:字串,去頭尾空白,上限 200 字(唔係問題唔收)
    const question =
      typeof body.question === "string" && body.question.trim()
        ? body.question.trim().slice(0, 200)
        : undefined;
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

    // 用戶 AI 設定(BYOK):冇帶 → 默認 Workers AI(同以前一樣)
    const ai = resolveServerAi(body);
    const kv = (getServerAiBindings()?.kv ?? null) as KvLike | null;
    const userText = buildUserText(realHex.number, lines as number[], locale, question);
    const cached = await prepareCachedStream(
      kv,
      {
        provider: activeProviderName(ai),
        model: ai?.model?.trim() ?? "",
        locale,
        lens: "",
        section: "yijing-interpret",
        inputHash: await sha256hex(JSON.stringify({ h: realHex.number, l: lines, q: question ?? "" })),
        promptHash: await sha256hex(`${PROMPT_VERSION}|${(ai?.customSystemPrompt ?? "").trim()}`),
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
      // SYS 固定要求繁體 → zhs 頁面靠字形鎖轉返簡體
      await scriptLocker(locale),
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
