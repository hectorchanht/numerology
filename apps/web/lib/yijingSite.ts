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
  { path: "/yijing/academy/hetu-luoshu", priority: 0.7 },
  { path: "/yijing/academy/zhangzhong-jue", priority: 0.7 },
  { path: "/yijing/academy/xiantian-houtian-bagua", priority: 0.7 },
  { path: "/yijing/academy/yixue-yuanliu", priority: 0.7 },
  { path: "/yijing/academy/hetu-shuli", priority: 0.7 },
  { path: "/yijing/academy/jiugong-suji", priority: 0.7 },
  { path: "/yijing/academy/tiyong", priority: 0.7 },
  { path: "/yijing/academy/ganzhi-suji", priority: 0.7 },
  { path: "/yijing/academy/sanyuan-minggua", priority: 0.7 },
  { path: "/yijing/academy/bazi-yueling", priority: 0.7 },
  { path: "/yijing/academy/ganzhi-li", priority: 0.7 },
  { path: "/yijing/academy/xiaoliuren", priority: 0.7 },
  { path: "/yijing/academy/hunpei", priority: 0.7 },
  { path: "/yijing/academy/meihua-qigua", priority: 0.7 },
  { path: "/yijing/academy/meihua-waiying", priority: 0.7 },
  { path: "/yijing/academy/liuyao-rumen", priority: 0.7 },
  { path: "/yijing/academy/liuyao-jinjie", priority: 0.7 },
  { path: "/yijing/academy/chenggu", priority: 0.7 },
  { path: "/yijing/academy/liunian-dizhi", priority: 0.7 },
  { path: "/yijing/academy/ziwu-jue", priority: 0.7 },
  { path: "/poster", priority: 0.7 },
];
