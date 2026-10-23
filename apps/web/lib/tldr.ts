/**
 * 章節 TL;DR 切分(純函數,可測試)。
 * AI 每節正文第一行輸出 `TL;DR:<一句話結論>`(標記見 @numerology/ai 的 TLDR_MARKER),
 * 同一條流、同一次請求——前端只係將佢切出嚟做摘要卡,唔會額外叫 AI。
 * 容錯:模型可能加粗/引用/用全形冒號;冇標記(舊歷史記錄、舊緩存)→ tldr 為 null,正文原樣。
 */

const MARKER_RE = /^(?:>\s*)?(?:\*\*|__)?\s*TL\s*;?\s*DR\s*(?:\*\*|__)?\s*[:：]?\s*(?:\*\*|__)?\s*/i;

export interface TldrSplit {
  /** 摘要(冇標記則 null;串流中可能係半句)。 */
  tldr: string | null;
  /** 摘要以外的正文 markdown。 */
  body: string;
}

/** 由(已去標題的)章節 markdown 切出 TL;DR 同正文。 */
export function splitTldr(markdown: string): TldrSplit {
  const s = markdown.replace(/^\s+/, "");
  // 串流剛開始只收到 "TL" / "**TL;" 之類:未夠判斷,先當摘要未到(避免閃出半個標記)。
  const bare = s.replace(/^(?:>\s*)?(?:\*\*|__)?/, "").toUpperCase();
  if (bare.length > 0 && bare.length < 5 && "TL;DR".startsWith(bare)) return { tldr: "", body: "" };
  const m = s.match(MARKER_RE);
  if (!m) return { tldr: null, body: markdown };
  const rest = s.slice(m[0].length);
  const nl = rest.indexOf("\n");
  const line = nl < 0 ? rest : rest.slice(0, nl);
  const body = nl < 0 ? "" : rest.slice(nl + 1).replace(/^\s+/, "");
  const tldr = line.replace(/(?:\*\*|__)\s*$/, "").trim();
  return { tldr, body };
}
