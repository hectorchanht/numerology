import type { Metadata } from "next";
import QimenTool from "./qimen";

export const metadata: Metadata = {
  alternates: { canonical: "/qimen" },
  title: "奇門遁甲 · 洛書命理",
  description: "奇門遁甲時家轉盤（拆補定局）：九宮、九星、八門、格局一盤睇晒。傳統民俗趣味參考，結果可分享。",
  openGraph: {
    title: "奇門遁甲 · 洛書命理",
    description: "問事起局，九星八門即排。",
  },
};

// ?h=<id> 歷史回顧 → dynamic;Cloudflare Pages 要求 dynamic route 用 edge runtime
export const runtime = "edge";

export default function QimenPage({ searchParams }: { searchParams?: { h?: string } }) {
  return <QimenTool historyId={searchParams?.h} />;
}
