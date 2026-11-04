import type { ProviderOptions } from "@numerology/ai";
import { activeProviderName, isMacProvider } from "@numerology/ai";

/**
 * 預熱超時:Workers AI 冷啟動首 token 可能超過 20s(線上實測 21s+),放寬到 60s;
 * Gemini 走非流式(首塊即全文,長節生成可能超 20s),同樣 60s;
 * 其它 provider 保持 20s(沿用 Pollinations 時代的防截斷調優)。
 *
 * 獨立成模塊:只依賴 @numerology/ai(純 Node 可導入),避開 aiOpts → aiBinding →
 * @cloudflare/next-on-pages 的鏈條(後者在純 Node 下無法 import)。
 */
export function primeTimeoutMs(opts: ProviderOptions | undefined): number {
  const name = activeProviderName(opts);
  // Mac provider:本地大模型冷啟動(由磁盤載入 16–20GB)+ 長 prompt prefill,
  // 首 token 實測可達 75s(qwen3:32b 冷載,2026-11-02 矩陣);思考開啟後
  // reasoning 首塊同樣要等載入+prefill。AI 解讀是低頻用戶主動動作、
  // 本地模型免費(Hector 準則 Accuracy >>> Speed),給 240s(約實測峰值 3 倍,
  // 仍有上限防真卡死)。注意這隻管首塊到達,流開始後不設總時長上限。
  if (isMacProvider(name)) return 240_000;
  return name === "workers-ai" || name === "gemini" ? 60_000 : 20_000;
}
