/**
 * API 錯誤分類:輸入/校驗錯誤 → 400,AI 上游錯誤 → 502。
 *
 * REAL-ERROR RULE(Hector 2026-10-20, STANDING):一律返回真實錯誤消息,
 * 不改寫、不泛化、不隱藏。本函數只做狀態碼分類,消息原樣透出
 * (僅超長截斷,避免上游返回超大 payload 時前端版面爆炸)。
 *
 * 約定:
 * - 400:請求體非法、出生信息非法、農曆日期非法、未知 provider(客戶端傳錯了名字)。
 * - 502:AI provider 側的失敗——key 缺失/鑑權失敗、模型下架 404、限流、
 *   上游 5xx、網絡/超時/DNS。這些是"我們的下游掛了",不是"用戶傳錯了",
 *   用 502 如實表達,避免把上游故障僞裝成客戶端錯誤。
 *
 * 僅服務端調用。分類依據:SDK 錯誤的 `status` 字段(OpenAI/Anthropic SDK 均攜帶)
 * + 錯誤消息的關鍵詞;調用方可用 stage 聲明錯誤發生的階段(AI 階段默認按 502 兜底)。
 */

export type ErrorStage = "input" | "ai";

interface Classified {
  status: 400 | 429 | 502;
  /** 真實錯誤消息(不含敏感信息:key 只走請求頭,從不出現在錯誤消息裏) */
  message: string;
  /** 機器可讀錯誤碼(MODEL_NOT_FOUND / AI_BUDGET);前端據此做緩存清理、額度提示等動作。 */
  code?: string;
}

/**
 * 預算耗盡(Workers AI 月 $2 硬上限):固定標記 AI_BUDGET_EXCEEDED,
 * 必須在限流關鍵詞之前匹配,返回 429(客戶端可據此提示切換 provider)。
 */
const BUDGET_RE = /AI_BUDGET_EXCEEDED|用量已達本月上限|用量已达本月上限/;

/** 校驗/輸入類錯誤的消息特徵 → 400。注意:「未知 AI provider」是客戶端傳錯名字,按 400。 */
const VALIDATION_RE =
  /非法|请求体格式错误|非数字|必须为整数|性别必须|超出范围|经度|未知 AI provider|农历日期必须|不能为空|未知.*章节/;

/** 上游故障的消息特徵 → 502(只做狀態碼分類,消息原樣透出)。 */
const UPSTREAM_RE =
  /rate.?limit|too many requests|quota|insufficient.*credit|429|unauthorized|authentication|invalid.*key|api.?key|401|403|timed? ?out|超时|ETIMEDOUT|ENOTFOUND|ECONNREFUSED|ECONNRESET|EAI_AGAIN|socket hang up|fetch failed|connection error|network|DNS|50[0-9]|502|503|504|internal server error|bad gateway|service unavailable|upstream|not found|no longer available/i;

/** 模型本身下架的消息特徵(須指向模型本身,避免 "page not found" 之類誤判)。 */
const MODEL_NOT_FOUND_RE = /model|no longer available|unknown model/i;

/** 真實消息透出:超長截斷(1500 字符),避免上游超大 payload 炸版面;非改寫。 */
const MAX_MESSAGE_LEN = 1500;
function capMessage(raw: string): string {
  const s = raw.trim();
  return s.length > MAX_MESSAGE_LEN ? s.slice(0, MAX_MESSAGE_LEN) + "…" : s;
}

function statusOf(err: unknown): number | undefined {
  const s = (err as { status?: unknown })?.status;
  return typeof s === "number" ? s : undefined;
}

/** 把任意錯誤分類爲 {status, message}。stage="ai" 時,無法識別的錯誤默認 502。 */
export function classifyError(err: unknown, stage: ErrorStage = "input"): Classified {
  const raw = err instanceof Error ? err.message : String(err);
  const status = statusOf(err);

  // 明確的輸入/校驗錯誤 → 400(無論哪個階段),消息原樣。
  if (VALIDATION_RE.test(raw)) return { status: 400, message: capMessage(raw) };

  // 預算耗盡 → 429(必須在 429→502 的限流映射之前),去掉內部標記。
  // 附 AI_BUDGET 碼:前端據此把各節失敗收成一張額度卡(消息仍原樣透出)。
  if (BUDGET_RE.test(raw)) return { status: 429, message: capMessage(raw.replace(/^AI_BUDGET_EXCEEDED:/, "")), code: "AI_BUDGET" };

  // 服務端配置缺失(binding 未配) → 502,保留原消息(它是給運維看的明確指引)。
  if (/binding 未配置/.test(raw)) return { status: 502, message: capMessage(raw) };

  // SDK 狀態碼:401/403(鑑權)/404(模型下架等)/408/429(限流)/5xx(上游) → 502,真實消息透出。
  // 其中 404 且消息指向模型本身(非其它資源) → 附 MODEL_NOT_FOUND 碼,前端據此清模型緩存。
  if (
    status !== undefined &&
    (status === 401 || status === 403 || status === 404 || status === 408 || status === 429 || status >= 500)
  ) {
    const code =
      status === 404 && MODEL_NOT_FOUND_RE.test(raw) ? "MODEL_NOT_FOUND" : undefined;
    return { status: 502, message: capMessage(raw) || "AI 服务异常,请稍后重试", code };
  }

  // 無狀態碼但消息特徵指向下游故障 → 502,真實消息透出。
  if (UPSTREAM_RE.test(raw)) return { status: 502, message: capMessage(raw) };

  // AI 階段兜底:調用 provider 時拋出的未知錯誤,按上游故障處理,真實消息透出。
  if (stage === "ai") return { status: 502, message: capMessage(raw) || "AI 服务异常,请稍后重试" };

  return { status: 400, message: capMessage(raw) || "请求失败" };
}

/** 把錯誤轉成 JSON 錯誤響應。fallback 用於非 Error 的極端情況。 */
export function errorResponse(err: unknown, opts: { fallback?: string; stage?: ErrorStage } = {}): Response {
  const { status, message, code } = classifyError(err, opts.stage ?? "input");
  const body: { error: string; code?: string } = { error: message || opts.fallback || "请求失败" };
  if (code) body.code = code;
  return Response.json(body, { status });
}
