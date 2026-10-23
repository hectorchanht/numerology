import type { Metadata } from "next";
import ChartPoster from "./poster";

export const metadata: Metadata = {
  alternates: { canonical: "/poster" },
  title: "命盤海報 · 水墨命盤",
  description:
    "水墨風命盤海報:取本機最新排盤,生成八字四柱、日主、紫微命宮主星、當前大運的分享圖,截圖即可分享。",
};

export default function PosterPage() {
  return (
    <div className="shell">
      <ChartPoster />
    </div>
  );
}
