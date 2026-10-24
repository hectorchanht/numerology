/**
 * API 错误分类:输入/校验错误 → 400,AI 上游错误 → 502。
 *
 * REAL-ERROR RULE(Hector 2026-10-20, STANDING):一律返回真实错误消息,
 * 不改写、不泛化、不隐藏。本函数只做状态码分类,消息原样透出
 * (仅超长截断,避免上游返回超大 payload 时前端版面爆炸)。
 *
 * 约定:
 * - 400:请求体非法、出生信息非法、农历日期非法、未知 provider(客户端传错了名字)。
 * - 502:AI provider 侧的失败——key 缺失/鉴权失败、模型下架 404、限流、
 *   上游 5xx、网络/超时/DNS。这些是"我们的下游挂了",不是"用户传错了",
 *   用 502 如实表达,避免把上游故障伪装成客户端错误。
 *
 * 仅服务端调用。分类依据:SDK 错误的 `status` 字段(OpenAI/Anthropic SDK 均携带)
 * + 错误消息的关键词;调用方可用 stage 声明错误发生的阶段(AI 阶段默认按 502 兜底)。
 */

export type ErrorStage = "input" | "ai";

interface Classified {
  status: 400 | 429 | 502;
  /** 真实错误消息(不含敏感信息:key 只走请求头,从不出现在错误消息里) */
  message: string;
}

/**
 * 预算耗尽(Workers AI 月 $2 硬上限):固定标记 AI_BUDGET_EXCEEDED,
 * 必须在限流关键词之前匹配,返回 429(客户端可据此提示切换 provider)。
 */
const BUDGET_RE = /AI_BUDGET_EXCEEDED|用量已達本月上限|用量已达本月上限/;

/** 校验/输入类错误的消息特征 → 400。注意:「未知 AI provider」是客户端传错名字,按 400。 */
const VALIDATION_RE =
  /非法|请求体格式错误|非数字|必须为整数|性别必须|超出范围|经度|未知 AI provider|农历日期必须|不能为空|未知.*章节/;

/** 上游故障的消息特征 → 502(只做状态码分类,消息原样透出)。 */
const UPSTREAM_RE =
  /rate.?limit|too many requests|quota|insufficient.*credit|429|unauthorized|authentication|invalid.*key|api.?key|401|403|timed? ?out|超时|ETIMEDOUT|ENOTFOUND|ECONNREFUSED|ECONNRESET|EAI_AGAIN|socket hang up|fetch failed|connection error|network|DNS|50[0-9]|502|503|504|internal server error|bad gateway|service unavailable|upstream|not found|no longer available/i;

/** 真实消息透出:超长截断(1500 字符),避免上游超大 payload 炸版面;非改写。 */
const MAX_MESSAGE_LEN = 1500;
function capMessage(raw: string): string {
  const s = raw.trim();
  return s.length > MAX_MESSAGE_LEN ? s.slice(0, MAX_MESSAGE_LEN) + "…" : s;
}

function statusOf(err: unknown): number | undefined {
  const s = (err as { status?: unknown })?.status;
  return typeof s === "number" ? s : undefined;
}

/** 把任意错误分类为 {status, message}。stage="ai" 时,无法识别的错误默认 502。 */
export function classifyError(err: unknown, stage: ErrorStage = "input"): Classified {
  const raw = err instanceof Error ? err.message : String(err);
  const status = statusOf(err);

  // 明确的输入/校验错误 → 400(无论哪个阶段),消息原样。
  if (VALIDATION_RE.test(raw)) return { status: 400, message: capMessage(raw) };

  // 预算耗尽 → 429(必须在 429→502 的限流映射之前),去掉内部标记。
  if (BUDGET_RE.test(raw)) return { status: 429, message: capMessage(raw.replace(/^AI_BUDGET_EXCEEDED:/, "")) };

  // 服务端配置缺失(binding 未配) → 502,保留原消息(它是给运维看的明确指引)。
  if (/binding 未配置/.test(raw)) return { status: 502, message: capMessage(raw) };

  // SDK 状态码:401/403(鉴权)/404(模型下架等)/408/429(限流)/5xx(上游) → 502,真实消息透出。
  if (
    status !== undefined &&
    (status === 401 || status === 403 || status === 404 || status === 408 || status === 429 || status >= 500)
  ) {
    return { status: 502, message: capMessage(raw) || "AI 服务异常,请稍后重试" };
  }

  // 无状态码但消息特征指向下游故障 → 502,真实消息透出。
  if (UPSTREAM_RE.test(raw)) return { status: 502, message: capMessage(raw) };

  // AI 阶段兜底:调用 provider 时抛出的未知错误,按上游故障处理,真实消息透出。
  if (stage === "ai") return { status: 502, message: capMessage(raw) || "AI 服务异常,请稍后重试" };

  return { status: 400, message: capMessage(raw) || "请求失败" };
}

/** 把错误转成 JSON 错误响应。fallback 用于非 Error 的极端情况。 */
export function errorResponse(err: unknown, opts: { fallback?: string; stage?: ErrorStage } = {}): Response {
  const { status, message } = classifyError(err, opts.stage ?? "input");
  return Response.json({ error: message || opts.fallback || "请求失败" }, { status });
}
