import type { Metadata } from "next";
import LiuyaoTool from "./tool";

export const metadata: Metadata = {
  alternates: { canonical: "/yijing/liuyao" },
  title: "六爻納甲 · 裝卦排盤",
  description: "六爻納甲裝卦:納甲干支、六親、世應、六獸、日辰月建旬空。純前端計算,不經網絡。",
};

// ?h=<id> 歷史回顧 → dynamic;Cloudflare Pages 要求 dynamic route 用 edge runtime
export const runtime = "edge";

export default function LiuyaoPage({ searchParams }: { searchParams?: { h?: string } }) {
  return (
    <>
      <LiuyaoTool historyId={searchParams?.h} />
    </>
  );
}
