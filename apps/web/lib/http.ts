/**
 * API 错误分类:输入/校验错误 → 400,AI 上游错误 → 502。
 *
 * 约定:
 * - 400:请求体非法、出生信息非法、农历日期非法、未知 provider(客户端传错了名字)。
 * - 502:AI provider 侧的失败——key 缺失/鉴权失败、限流、上游 5xx、网络/超时/DNS。
 *   这些是"我们的下游挂了",不是"用户传错了",用 502 如实表达,避免把上游故障
 *   伪装成客户端错误(也避免前端把限流当成表单错误提示用户改输入)。
 *
 * 仅服务端调用。分类依据:SDK 错误的 `status` 字段(OpenAI/Anthropic SDK 均携带)
 * + 错误消息的关键词;调用方可用 stage 声明错误发生的阶段(AI 阶段默认按 502 兜底)。
 */

export type ErrorStage = "input" | "ai";

interface Classified {
  status: 400 | 429 | 502;
  /** 给用户看的清晰中文信息(不含敏感信息) */
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

/** 上游故障特征 → 502(按类别给出清晰中文信息)。 */
const UPSTREAM_PATTERNS: { re: RegExp; message: string }[] = [
  {
    re: /rate.?limit|too many requests|quota|insufficient.*credit|429/i,
    message: "AI 服务暂时繁忙(触发限流),请稍后再试",
  },
  {
    re: /unauthorized|authentication|invalid.*key|api.?key|401|403/i,
    message: "AI 服务鉴权失败(请检查 API key 是否正确/有效)",
  },
  {
    re: /timed? ?out|超时|ETIMEDOUT|ENOTFOUND|ECONNREFUSED|ECONNRESET|EAI_AGAIN|socket hang up|fetch failed|connection error|network|DNS/i,
    message: "AI 服务网络异常(连接失败或超时),请稍后重试",
  },
  {
    re: /50[0-9]|502|503|504|internal server error|bad gateway|service unavailable|upstream/i,
    message: "AI 服务暂时不可用(上游错误),请稍后重试",
  },
];

function statusOf(err: unknown): number | undefined {
  const s = (err as { status?: unknown })?.status;
  return typeof s === "number" ? s : undefined;
}

/** 把任意错误分类为 {status, message}。stage="ai" 时,无法识别的错误默认 502。 */
export function classifyError(err: unknown, stage: ErrorStage = "input"): Classified {
  const raw = err instanceof Error ? err.message : String(err);
  const status = statusOf(err);

  // 明确的输入/校验错误 → 400(无论哪个阶段)。
  if (VALIDATION_RE.test(raw)) return { status: 400, message: raw };

  // 预算耗尽 → 429(必须在 429→502 的限流映射之前)。
  if (BUDGET_RE.test(raw)) return { status: 429, message: raw.replace(/^AI_BUDGET_EXCEEDED:/, "") };

  // 服务端配置缺失(binding 未配) → 502 但保留原消息(它是给运维看的明确指引,
  // 不应被 AI 阶段兜底替换成泛化文案)。
  if (/binding 未配置/.test(raw)) return { status: 502, message: raw };

  // SDK 状态码:401/403(鉴权)/408/429(限流)/5xx(上游) → 502。
  if (status !== undefined && (status === 401 || status === 403 || status === 408 || status === 429 || status >= 500)) {
    const hit = UPSTREAM_PATTERNS.find((p) => p.re.test(raw) || p.re.test(String(status)));
    return { status: 502, message: hit?.message ?? "AI 服务异常,请稍后重试" };
  }

  const hit = UPSTREAM_PATTERNS.find((p) => p.re.test(raw));
  if (hit) return { status: 502, message: hit.message };

  // AI 阶段兜底:调用 provider 时抛出的未知错误,按上游故障处理。
  if (stage === "ai") return { status: 502, message: "AI 服务异常,请稍后重试" };

  return { status: 400, message: raw || "请求失败" };
}

/** 把错误转成 JSON 错误响应。fallback 用于非 Error 的极端情况。 */
export function errorResponse(err: unknown, opts: { fallback?: string; stage?: ErrorStage } = {}): Response {
  const { status, message } = classifyError(err, opts.stage ?? "input");
  return Response.json({ error: message || opts.fallback || "请求失败" }, { status });
}
