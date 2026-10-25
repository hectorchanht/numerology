"use client";

import { useSyncExternalStore } from "react";

/** 主 tab:起盤 / 解讀(命盤+報告+大運合併,版內 Seg 分三 view)/ 歷史。工具一律放下層(SUB_GROUPS),唔佔 tab 位。 */
export type Tab = "home" | "ai" | "history";
export const TABS: readonly Tab[] = ["home", "ai", "history"];

/** 解讀版內的三個 view:命盤 / 報告 / 大運。 */
export type AiView = "chart" | "report" | "fortune";
let aiView: AiView = "chart";
const aiListeners = new Set<() => void>();

/** 切去解讀版並選定 view(命盤 / 報告 / 大運)。 */
export function goAi(view: AiView): void {
  if (view !== aiView) {
    aiView = view;
    aiListeners.forEach((fn) => fn());
  }
  go("ai");
}

/** 只切 view(已喺解讀版內用)。 */
export function setAiView(view: AiView): void {
  if (view === aiView) return;
  aiView = view;
  aiListeners.forEach((fn) => fn());
}

function subscribeAi(fn: () => void): () => void {
  aiListeners.add(fn);
  return () => {
    aiListeners.delete(fn);
  };
}

export function useAiView(): AiView {
  return useSyncExternalStore(subscribeAi, () => aiView, () => "chart" as AiView);
}

/** 非 tab 的子畫面:設定(右上齒輪)、命盤對話。返回時回到打開前的畫面。 */
export type Screen = Tab | "settings" | "chat";

interface NavState {
  screen: Screen;
  /** 子畫面的返回目標(亦用作 tab bar 高亮)。 */
  back: Tab;
}

/** 輕量外部 store(同 i18n 模式):跨 client 路由切換保留,/yijing 等頁返回首頁時仍記得目標 tab。 */
let state: NavState = { screen: "home", back: "home" };
const listeners = new Set<() => void>();

const isTab = (s: Screen): s is Tab => (TABS as readonly string[]).includes(s);

export function go(screen: Screen): void {
  const back = isTab(screen) ? screen : isTab(state.screen) ? state.screen : state.back;
  if (screen === state.screen && back === state.back) return;
  state = { screen, back };
  listeners.forEach((fn) => fn());
  try {
    window.scrollTo(0, 0);
  } catch {
    /* ignore */
  }
}

/** 從子畫面返回。 */
export function goBack(): void {
  go(state.back);
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

const SERVER_STATE: NavState = { screen: "home", back: "home" };

export function useNav(): NavState & { tab: Tab } {
  const s = useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
  return { ...s, tab: isTab(s.screen) ? s.screen : s.back };
}
