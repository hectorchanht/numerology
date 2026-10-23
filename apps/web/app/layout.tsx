import type { Metadata, Viewport } from "next";
import "./globals.css";
import { YijingNav } from "@/components/YijingNav";
import { TabBar } from "@/components/TabBar";
import { SideNav } from "@/components/SideNav";
import { DragScroll } from "@/components/DragScroll";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

export const metadata: Metadata = {
  title: "命理 · 八字紫微合參",
  description:
    "AI 輔助的中國命理工具:八字四柱 + 紫微斗數,動靜結合解讀人生格局與大運走向。文化與自我反思工具,非宿命預測。",
  appleWebApp: { capable: true, statusBarStyle: "black" },
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
};

// DARK-THEME DEFAULT:theme-color 純黑,唔會閃白;用戶揀 light 時由 lib/theme 改寫。
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // data-theme 由 inline script 喺首幀前改寫(light),故此 suppressHydrationWarning。
    <html lang="zh-Hant" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <SideNav />
        <div className="app">
          <YijingNav />
          {children}
        </div>
        <TabBar />
        <DragScroll />
      </body>
    </html>
  );
}
