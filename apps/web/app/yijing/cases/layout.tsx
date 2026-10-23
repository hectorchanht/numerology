import type { Metadata } from "next";

/** 占例係 client component,metadata 放喺呢個 server layout。 */
export const metadata: Metadata = {
  title: "占例 · 歷代占筮案例",
  description:
    "歷代占筮案例:睇古人點樣起卦斷事,卦例配原文出處,學解卦最快嘅方法。",
  alternates: { canonical: "/yijing/cases" },
};

export default function CasesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
