/** 站點基礎 URL 與公開路由(供 sitemap.ts 與測試共用)。 */
export const SITE_BASE = "https://numerology.dawnstudio.app";

export interface SiteRoute {
  path: string;
  priority: number;
}

export const SITE_ROUTES: SiteRoute[] = [
  { path: "/", priority: 1 },
  { path: "/yijing", priority: 0.9 },
  { path: "/yijing/gua", priority: 0.9 },
  { path: "/yijing/liuyao", priority: 0.8 },
  { path: "/yijing/meihua", priority: 0.8 },
  { path: "/yijing/cases", priority: 0.8 },
  { path: "/yijing/academy", priority: 0.8 },
  { path: "/yijing/academy/basics", priority: 0.7 },
  { path: "/yijing/academy/reading-gua", priority: 0.7 },
  { path: "/yijing/academy/asking", priority: 0.7 },
  { path: "/yijing/academy/interpreting", priority: 0.7 },
  { path: "/poster", priority: 0.7 },
];
