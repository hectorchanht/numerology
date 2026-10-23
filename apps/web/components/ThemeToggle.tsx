"use client";

import { useSyncExternalStore } from "react";
import { useLocale } from "@/lib/i18n";
import { DEFAULT_THEME, applyTheme, nextTheme, readTheme } from "@/lib/theme";
import { Icon } from "@/components/Icon";

/** 所有 ThemeToggle 實例共享:DOM(`<html data-theme>`)係唯一真相,切換即通知。 */
const listeners = new Set<() => void>();
function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** 頂部導航的主題切換鍵:dark 顯示太陽(撳 → 淺色),light 顯示月亮(撳 → 深色)。 */
export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useLocale();
  const theme = useSyncExternalStore(subscribe, readTheme, () => DEFAULT_THEME);
  const toLight = theme === "dark";
  return (
    <button
      type="button"
      className={className ? `icon-btn ${className}` : "icon-btn"}
      onClick={() => {
        applyTheme(nextTheme(theme));
        listeners.forEach((fn) => fn());
      }}
      aria-label={t(toLight ? "nav.themeToLight" : "nav.themeToDark")}
    >
      <Icon name={toLight ? "sun" : "moon"} />
    </button>
  );
}
