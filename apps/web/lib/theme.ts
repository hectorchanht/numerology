/** 主題(dark / light):DARK-THEME DEFAULT,選擇存 localStorage,`<html data-theme>` 驅動 CSS 變數。 */
export type Theme = "dark" | "light";

export const DEFAULT_THEME: Theme = "dark";
export const THEME_KEY = "numerology-theme";

/** 瀏覽器 chrome(theme-color meta)跟主題:dark 黑、light 白。 */
export const THEME_COLOR: Record<Theme, string> = { dark: "#000000", light: "#ffffff" };

export function parseTheme(v: string | null | undefined): Theme {
  return v === "light" || v === "dark" ? v : DEFAULT_THEME;
}

export function nextTheme(t: Theme): Theme {
  return t === "dark" ? "light" : "dark";
}

/**
 * 首幀前執行的 inline script(放 <head>):讀 localStorage → 設 data-theme + theme-color,避免閃錯主題。
 * 由上面常數生成,同 React 端保持單一來源。
 */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});t=t==="light"?"light":"dark";var r=document.documentElement;r.dataset.theme=t;r.style.colorScheme=t;var c=t==="light"?${JSON.stringify(THEME_COLOR.light)}:${JSON.stringify(THEME_COLOR.dark)};var f=function(){var m=document.querySelector('meta[name="theme-color"]');if(m)m.content=c;};f();document.addEventListener("DOMContentLoaded",f);}catch(e){}`;

/** 讀當前主題(以 DOM 為準;SSR 回預設)。 */
export function readTheme(): Theme {
  if (typeof document === "undefined") return DEFAULT_THEME;
  return parseTheme(document.documentElement.dataset.theme);
}

/** 套用 + 持久化主題,同步 theme-color meta。 */
export function applyTheme(t: Theme): void {
  const root = document.documentElement;
  root.dataset.theme = t;
  root.style.colorScheme = t;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[t]);
  try {
    window.localStorage.setItem(THEME_KEY, t);
  } catch {
    /* ignore */
  }
}
