import type { Metadata } from "next";
import YijingHistoryList from "./history";

export const metadata: Metadata = {
  alternates: { canonical: "/yijing/history" },
  title: "占卦歷史",
  description: "易經占卦歷史記錄:銅錢、梅花、六爻的起卦記錄,只儲存於本機,隨時回看。",
};

export default function YijingHistoryPage() {
  return <YijingHistoryList />;
}
