"use client";

/**
 * 「去 AI Chat 問呢句」的一次性請求:選詞 popover → ChatPanel。
 * - requestChatAsk(q):記下問題並通知所有監聽者;呼叫方自行 go("chat") 切畫面。
 * - ChatPanel 掛載時訂閱,收到請求即 takePendingChatAsk() 取走問題並追問。
 * - setChatAvailable(v):page.tsx 根據有冇可用命盤設定;冇命盤時不顯示跳轉掣。
 */

type Listener = () => void;

const listeners = new Set<Listener>();
let pending: string | null = null;
let chatAvailable = false;

export function setChatAvailable(v: boolean): void {
  chatAvailable = v;
}

export function isChatAvailable(): boolean {
  return chatAvailable;
}

/** 發起請求:有 ChatPanel 在聽就會接住問題。 */
export function requestChatAsk(question: string): void {
  const q = question.trim();
  if (!q) return;
  pending = q;
  listeners.forEach((fn) => fn());
}

/** ChatPanel 在請求到來時調用,取走問題(一次性,防重複追問)。 */
export function takePendingChatAsk(): string | null {
  const q = pending;
  pending = null;
  return q;
}

export function onChatAskRequest(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
