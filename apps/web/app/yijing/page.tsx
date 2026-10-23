import type { Metadata } from "next";
import YijingTool from "./tool";

export const metadata: Metadata = {
  alternates: { canonical: "/yijing" },
  title: "易經占卦 · 三錢起卦",
  description:
    "三錢起卦占卦工具:六爻由下而上,得本卦、變卦、互卦與動爻爻辭。問題只存於本頁,不會上傳;AI 解卦即將推出。",
};

// ?h=<id> 歷史回顧 → dynamic;Cloudflare Pages 要求 dynamic route 用 edge runtime
export const runtime = "edge";

export default function YijingPage({ searchParams }: { searchParams?: { h?: string } }) {
  return (
    <>
      <YijingTool historyId={searchParams?.h} />
    </>
  );
}
