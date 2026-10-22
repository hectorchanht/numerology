import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "命理 · 八字紫微合參",
  description:
    "AI 輔助的中國命理工具:八字四柱 + 紫微斗數,動靜結合解讀人生格局與大運走向。文化與自我反思工具,非宿命預測。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
