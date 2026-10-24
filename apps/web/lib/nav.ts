"use client";

import { useSyncExternalStore } from "react";

/** 底部 tab(最多 5 個):起盤 / 命盤 / 報告 / 大運 / 歷史。工具一律放下層(SUB_LINKS),唔佔 tab 位。 */
export type Tab = "home" | "chart" | "report" | "fortune" | "history";
export const TABS: readonly Tab[] = ["home", "chart", "report", "fortune", "history"];

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
