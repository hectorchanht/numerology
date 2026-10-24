import type { Metadata } from "next";

/** 易經學院係 client component,metadata 放喺呢個 server layout。 */
export const metadata: Metadata = {
  title: "易經學院 · 五課入門",
  description:
    "由淺入深學易經:四課原創入門課程 + 測驗,進度存本機。學識起卦、解卦,越學越深。",
  alternates: { canonical: "/yijing/academy" },
};

export default function AcademyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
