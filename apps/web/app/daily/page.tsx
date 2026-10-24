import type { Metadata } from "next";
import DailyTool from "./daily";

export const metadata: Metadata = {
  alternates: { canonical: "/daily" },
  title: "今日運勢 · 洛書命理",
  description: "每日宜忌、沖煞、吉時、生肖小貼士。傳統通勝趣味參考，結果可分享。",
  openGraph: {
    title: "今日運勢 · 洛書命理",
    description: "今日宜忌吉時，一睇就知。",
  },
};

export default function DailyPage() {
  return (
      <DailyTool />
  );
}
