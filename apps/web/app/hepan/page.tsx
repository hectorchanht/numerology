import type { Metadata } from "next";
import HepanTool from "./hepan";

export const metadata: Metadata = {
  alternates: { canonical: "/hepan" },
  title: "紫微合盤 · 洛書命理",
  description: "兩個人嘅紫微命盤對照：五行局、命宮主星、身宮、夫妻宮、日主。傳統民俗趣味參考，結果可分享。",
  openGraph: {
    title: "紫微合盤 · 洛書命理",
    description: "你哋兩個嘅命盤，夾唔夾？",
  },
};

export default function HepanPage() {
  return (
      <HepanTool />
  );
}
