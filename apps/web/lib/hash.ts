/**
 * 哈希小工具(瀏覽器 https/localhost、edge runtime、node18+ 均有 WebCrypto)。
 * 用於:AI 響應緩存鍵、歷史記錄 ID(排盤是輸入的確定性函數)。
 */

/** sha256 hex(小寫)。 */
export async function sha256hex(text: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error("当前环境不支持 WebCrypto(subtle)");
  const digest = await subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** 出生輸入的規範化哈希:同一組輸入 → 同一命盤 → 同一哈希。 */
export async function stableInputHash(input: Record<string, unknown>): Promise<string> {
  const norm = {
    year: input.year,
    month: input.month,
    day: input.day,
    hour: input.hour,
    minute: input.minute ?? 0,
    gender: input.gender,
    longitude: input.longitude ?? null,
    // 後加欄位:只喺有值時入鍵,舊紀錄嘅哈希不變。
    ...(input.latitude !== undefined && input.latitude !== null ? { latitude: input.latitude } : {}),
  };
  return sha256hex(JSON.stringify(norm));
}
