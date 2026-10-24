import { fetchProviderModels } from "@/lib/models";
import { getServerAiBindings } from "@/lib/aiBinding";
import { listProviders } from "@numerology/ai";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * 动态模型列表:
 * - GET /api/models → provider 元信息(分组/是否需 key/申请地址),供设置面板渲染。
 * - GET /api/models?provider=<name> → 该 provider 的模型列表。
 *   OpenAI 兼容 provider 实时代理 {baseURL}/models;workers-ai 返回构建时核验表
 *   (binding 无 list 接口);anthropic/custom 返回静态表。
 * key 经 `X-AI-Key` 请求头传递(不进 URL,不记日志),绝不出现在响应中。
 */
export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const provider = (url.searchParams.get("provider") || "").trim().toLowerCase();

  if (!provider) {
    return Response.json({
      providers: listProviders().map((p) => ({
        name: p.name,
        labelKey: p.labelKey,
        group: p.group,
        needsKey: p.needsKey,
        signup: p.signup ?? null,
      })),
    });
  }

  if (provider !== "custom" && !listProviders().some((p) => p.name === provider)) {
    return Response.json({ error: `未知 AI provider="${provider}"` }, { status: 400 });
  }

  try {
    const key = req.headers.get("X-AI-Key")?.trim() || undefined;
    const baseUrl = url.searchParams.get("baseUrl")?.trim() || undefined;
    const result = await fetchProviderModels(provider, {
      key,
      baseUrl,
      kv: getServerAiBindings()?.kv ?? undefined,
    });
    return Response.json(result, {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "模型列表获取失败";
    return Response.json({ provider, source: "error", models: [], error: message }, { status: 502 });
  }
}
