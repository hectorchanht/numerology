import type { Metadata } from "next";
import MeihuaTool from "./tool";

export const metadata: Metadata = {
  alternates: { canonical: "/yijing/meihua" },
  title: "梅花易數 · 時間起卦",
  description: "梅花易數時間起卦:年月日時起卦,體用生剋斷吉凶,附本卦變卦互卦與 AI 解卦。",
};

export default function MeihuaPage({ searchParams }: { searchParams?: { h?: string } }) {
  return <MeihuaTool historyId={searchParams?.h} />;
}
