/**
 * 哈希小工具(浏览器 https/localhost、edge runtime、node18+ 均有 WebCrypto)。
 * 用于:AI 响应缓存键、历史记录 ID(排盘是输入的确定性函数)。
 */

/** sha256 hex(小写)。 */
export async function sha256hex(text: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error("当前环境不支持 WebCrypto(subtle)");
  const digest = await subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** 出生输入的规范化哈希:同一组输入 → 同一命盘 → 同一哈希。 */
export async function stableInputHash(input: Record<string, unknown>): Promise<string> {
  const norm = {
    year: input.year,
    month: input.month,
    day: input.day,
    hour: input.hour,
    minute: input.minute ?? 0,
    gender: input.gender,
    longitude: input.longitude ?? null,
  };
  return sha256hex(JSON.stringify(norm));
}
