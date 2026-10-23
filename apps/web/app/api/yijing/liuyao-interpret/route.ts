import { chatStream, type ProviderOptions } from "@numerology/ai";
import { paigua, ganzhiForDate, castYijing, type YaoValue } from "@numerology/engine";
import { getHexagram } from "@numerology/knowledge";
import { ensureEnv } from "@/lib/env";
import { streamToPrimedResponse } from "@/lib/stream";
import { primeTimeoutMs } from "@/lib/primeTimeout";
import { errorResponse } from "@/lib/http";
import { prepareCachedStream, type KvLike } from "@/lib/aiCache";
import { scriptLocker } from "@/lib/script";
import { sha256hex } from "@/lib/hash";
import { getServerAiBindings, getWaitUntil } from "@/lib/aiBinding";
import { buildLiuyaoUserText, liuyaoSystemPrompt } from "@/lib/liuyaoPrompt";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/** prompt 版本:改 prompt 即換緩存鍵,不串味。 */
const PROMPT_VERSION = "liuyao-interpret/v1";

/**
 * POST /api/yijing/liuyao-interpret — 六爻納甲 AI 解讀。
 * 強制走 Workers AI binding,與其他 AI 路由共用同一個 $2/月 KV 預算守衛
 * (超支 → 乾淨 JSON 429,不燒錢);命中 KV 緩存則零消耗。
 * 不收用戶問題:純按納甲盤解讀(privacy:不送任何個人資料,連日期都只用來取日辰月建)。
 */
export async function POST(req: Request): Promise<Response> {
  try {
    await ensureEnv();
    const body = (await req.json()) as {
      lines?: unknown;
      date?: unknown;
      locale?: unknown;
    };
    const lines = body.lines;
    const locale = body.locale === "zhs" || body.locale === "en" ? body.locale : "zht";
    if (
      !Array.isArray(lines) ||
      lines.length !== 6 ||
      !lines.every((v) => v === 6 || v === 7 || v === 8 || v === 9)
    ) {
      throw new Error("非法請求: lines 須為 6 個爻值(6/7/8/9)");
    }
    const dateStr = typeof body.date === "string" ? body.date : "";
    const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
    if (!dm) throw new Error("非法請求: date 須為 YYYY-MM-DD");
    const y = Number(dm[1]);
    const mo = Number(dm[2]);
    const d = Number(dm[3]);

    // 以引擎重算為準,不信任客戶端傳的任何排盤結果
    const tup = lines as [YaoValue, YaoValue, YaoValue, YaoValue, YaoValue, YaoValue];
    const gz = ganzhiForDate(y, mo, d);
    const r = paigua(tup, gz.dayStem, gz.dayBranch, gz.monthBranch);
    const cast = castYijing(tup);
    const ben = getHexagram(cast.hexagram);
    if (!ben) throw new Error("非法請求: 找不到本卦");
    const bian = cast.changed ? getHexagram(cast.changed) : undefined;

    const ai: ProviderOptions = {
      provider: "workers-ai",
      aiBinding: getServerAiBindings() ?? undefined,
    };
    const kv = (getServerAiBindings()?.kv ?? null) as KvLike | null;
    const userText = buildLiuyaoUserText({
      benName: `${ben.symbol} ${ben.name}`,
      benNumber: ben.number,
      bianName: bian ? `${bian.symbol} ${bian.name}` : undefined,
      r,
      locale,
    });
    const cached = await prepareCachedStream(
      kv,
      {
        provider: "workers-ai",
        model: "",
        locale,
        lens: "",
        section: "liuyao-interpret",
        inputHash: await sha256hex(JSON.stringify({ h: ben.number, l: lines, d: dateStr })),
        promptHash: await sha256hex(PROMPT_VERSION),
      },
      () =>
        chatStream(
          {
            system: [{ text: liuyaoSystemPrompt() }],
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
    return errorResponse(err, { fallback: "六爻 AI 解讀失敗", stage: "ai" });
  }
}
