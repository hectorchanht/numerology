/** 站點基礎 URL 與公開路由(供 sitemap.ts 與測試共用)。 */
export const SITE_BASE = "https://numerology-7v4.pages.dev";

export interface SiteRoute {
  path: string;
  priority: number;
}

export const SITE_ROUTES: SiteRoute[] = [
  { path: "/", priority: 1 },
  { path: "/yijing", priority: 0.9 },
  { path: "/yijing/gua", priority: 0.9 },
  { path: "/poster", priority: 0.7 },
];
