import type { Metadata } from "next";

/** 梅花易數係 client component,metadata 放喺呢個 server layout。 */
export const metadata: Metadata = {
  title: "梅花易數 · 時間起卦",
  description:
    "梅花易數時間起卦:年月日時起上下卦、取動爻,體用生剋斷吉凶。純前端計算,不經網絡。",
  alternates: { canonical: "/yijing/meihua" },
};

export default function MeihuaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
