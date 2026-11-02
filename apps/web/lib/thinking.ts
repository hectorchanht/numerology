/**
 * 思考過程分拆(2026-11-02,Hector 定):LLM 可以思考——report/fortune 路徑開啟
 * captureThinking 後,provider 將結構化 reasoning 同 content 內嵌嘅
 * <think>…</think> 統一正規化成 text stream 入面嘅 <think> 段。客戶端喺呢度
 * 將思考同正文分開:版面次序 = 折疊思考 → TL;DR → 全文(見 ThinkingFold)。
 *
 * 流式語義:未閉合嘅 <think>(仲諗緊)成段歸 thinking,content 為空——
 * 畫面喺思考期間只顯示折疊塊 header「思考中」,唔會閃出半截思考或正文。
 * 一個回應理論上只得一段思考(開頭),但函數容忍多段/文中段:全部抽走、
 * 以空行連接,content 保持其餘次序。
 */

export interface SplitThinking {
  /** 思考全文(多段以空行連接);冇思考 → ""。 */
  thinking: string;
  /** 抽走思考後嘅正文(前後空白已清)。 */
  content: string;
  /** true = 有未閉合嘅 <think>(流式思考進行中,content 尚未開始)。 */
  open: boolean;
}

const OPEN = "<think>";
const CLOSE = "</think>";

export function splitThinking(text: string): SplitThinking {
  if (!text.includes(OPEN)) return { thinking: "", content: text, open: false };
  const thinks: string[] = [];
  let content = "";
  let rest = text;
  let open = false;
  for (;;) {
    const i = rest.indexOf(OPEN);
    if (i < 0) {
      content += rest;
      break;
    }
    content += rest.slice(0, i);
    const after = rest.slice(i + OPEN.length);
    const j = after.indexOf(CLOSE);
    if (j < 0) {
      // 未閉合:餘下全部係思考(流式中途狀態,或被截斷嘅最終文本)。
      thinks.push(after);
      open = true;
      break;
    }
    thinks.push(after.slice(0, j));
    rest = after.slice(j + CLOSE.length);
  }
  const thinking = thinks.map((t) => t.trim()).filter(Boolean).join("\n\n");
  return { thinking, content: content.trim(), open };
}

/** 歷史記錄還原成單一 markdown 俾顯示層再分拆用(saveSection 分開存兩部分)。 */
export function joinThinking(thinking: string | undefined, content: string): string {
  const t = (thinking ?? "").trim();
  if (!t) return content;
  return `${OPEN}${t}${CLOSE}\n\n${content}`;
}
