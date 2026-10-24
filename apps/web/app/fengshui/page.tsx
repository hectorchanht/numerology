import type { Metadata } from "next";
import FengshuiTool from "./fengshui";

export const metadata: Metadata = {
  alternates: { canonical: "/fengshui" },
  title: "玄空飛星 · 洛書命理",
  description: "玄空飛星宅命盤：坐向加建造年份，九宮運星山星向星、旺衰一盤睇晒。傳統風水民俗趣味參考，結果可分享。",
  openGraph: {
    title: "玄空飛星 · 洛書命理",
    description: "你間屋行緊咩運？九宮飛星即排。",
  },
};

export default function FengshuiPage() {
  return (
      <FengshuiTool />
  );
}
