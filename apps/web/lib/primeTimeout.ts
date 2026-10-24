import type { ProviderOptions } from "@numerology/ai";
import { activeProviderName } from "@numerology/ai";

/**
 * 预热超时:Workers AI 冷启动首 token 可能超过 20s(线上实测 21s+),放宽到 60s;
 * Gemini 走非流式(首块即全文,长节生成可能超 20s),同样 60s;
 * 其它 provider 保持 20s(沿用 Pollinations 时代的防截断调优)。
 *
 * 独立成模块:只依赖 @numerology/ai(纯 Node 可导入),避开 aiOpts → aiBinding →
 * @cloudflare/next-on-pages 的链条(后者在纯 Node 下无法 import)。
 */
export function primeTimeoutMs(opts: ProviderOptions | undefined): number {
  const name = activeProviderName(opts);
  // mac-llm:Mac 本地模型冷启动(18-20GB 模型由磁盘载入)+qwen 思考,首 token 可能远超 60s。
  if (name === "mac-llm") return 120_000;
  return name === "workers-ai" || name === "gemini" ? 60_000 : 20_000;
}
