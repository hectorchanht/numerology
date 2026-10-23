import type { Metadata, Viewport } from "next";
import "./globals.css";
import { YijingNav } from "@/components/YijingNav";
import { TabBar } from "@/components/TabBar";

export const metadata: Metadata = {
  title: "命理 · 八字紫微合參",
  description:
    "AI 輔助的中國命理工具:八字四柱 + 紫微斗數,動靜結合解讀人生格局與大運走向。文化與自我反思工具,非宿命預測。",
  appleWebApp: { capable: true, statusBarStyle: "black" },
};

// DARK-THEME DEFAULT:theme-color 純黑,唔會閃白。
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body>
        <div className="app">
          <YijingNav />
          {children}
        </div>
        <TabBar />
      </body>
    </html>
  );
}
