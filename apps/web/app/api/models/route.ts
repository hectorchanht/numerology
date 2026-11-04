import { fetchProviderModels } from "@/lib/models";
import { getServerAiBindings, getMacLlmAccessHeaders } from "@/lib/aiBinding";
import { isMacProvider } from "@/lib/providerMeta";
import { listProviders, providerBaseUrl } from "@numerology/ai";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * 動態模型列表:
 * - GET /api/models → provider 元信息(分組/是否需 key/申請地址),供設置面板渲染。
 * - GET /api/models?provider=<name> → 該 provider 的模型列表。
 *   OpenAI 兼容 provider 實時代理 {baseURL}/models;workers-ai 返回構建時覈驗表
 *   (binding 無 list 接口);anthropic/custom 返回靜態表。
 * key 經 `X-AI-Key` 請求頭傳遞(不進 URL,不記日誌),絕不出現在響應中。
 */
export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const rawProvider = (url.searchParams.get("provider") || "").trim().toLowerCase();
  // 退役舊名正規化:mac-mlx(MLX 停用) → mac-llm,以下全部按 mac-llm 處理。
  const provider = rawProvider === "mac-mlx" ? "mac-llm" : rawProvider;

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

  // 已知 provider:展示列表(listProviders)之內的名字,或有 def 在冊的名字
  // (退役舊名 mac-mlx 已在上面正規化爲 mac-llm,不會來到這裏)。
  const known =
    provider === "custom" ||
    listProviders().some((p) => p.name === provider) ||
    providerBaseUrl(provider) !== undefined;
  if (!known) {
    return Response.json({ error: `未知 AI provider="${provider}"` }, { status: 400 });
  }

  try {
    const key = req.headers.get("X-AI-Key")?.trim() || undefined;
    const baseUrl = url.searchParams.get("baseUrl")?.trim() || undefined;
    const result = await fetchProviderModels(provider, {
      key,
      baseUrl,
      kv: getServerAiBindings()?.kv ?? undefined,
      accessHeaders: isMacProvider(provider) ? getMacLlmAccessHeaders() : undefined,
    });
    return Response.json(result, {
      headers: {
        "Cache-Control": isMacProvider(provider) ? "no-store" : "public, max-age=300",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "模型列表获取失败";
    return Response.json({ provider, source: "error", models: [], error: message }, { status: 502 });
  }
}
