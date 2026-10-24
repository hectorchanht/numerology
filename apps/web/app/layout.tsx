import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SelectionToolbar } from "@/components/SelectionToolbar";
import { TabBar } from "@/components/TabBar";
import { AppShell } from "@/components/AppShell";
import { SideNav } from "@/components/SideNav";
import { DragScroll } from "@/components/DragScroll";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

export const metadata: Metadata = {
  metadataBase: new URL("https://numerology.dawnstudio.app"),
  title: {
    default: "洛書命理 · 八字紫微合參",
    template: "%s · 洛書命理",
  },
  description:
    "AI 輔助的中國命理工具:八字四柱 + 紫微斗數,動靜結合解讀人生格局與大運走向。另有易經占卦、六十四卦庫、六爻納甲與命理學院。文化與自我反思工具,非宿命預測。",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "zh_Hant",
    alternateLocale: ["zh_Hans", "en"],
    url: "/",
    siteName: "洛書命理 · 八字紫微合參",
    title: "洛書命理 · 八字紫微合參",
    description:
      "同一出生時刻,排出八字同紫微兩個盤,再由 AI 合參解讀。另有易經占卦、六十四卦庫與命理學院,免費使用。",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "洛書命理 · 八字紫微合參 — AI 輔助的中國命理工具",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "洛書命理 · 八字紫微合參",
    description: "同一出生時刻,排出八字同紫微兩個盤,再由 AI 合參解讀。免費使用。",
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
  appleWebApp: { capable: true, statusBarStyle: "black" },
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
};

// SEO:結構化資料(WebSite + 出品方),幫搜尋引擎理解個站。
const SITE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "洛書命理 · 八字紫微合參",
  alternateName: "Luo Shu · BaZi & Zi Wei",
  url: "https://numerology.dawnstudio.app",
  inLanguage: ["zh-Hant", "zh-Hans", "en"],
  description:
    "AI 輔助的中國命理工具:八字四柱 + 紫微斗數合參解讀,另有易經占卦、六十四卦庫、六爻納甲與命理學院。",
  publisher: {
    "@type": "Organization",
    name: "Dawn Studio",
    url: "https://dawnstudio.app",
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
        <script
          dangerouslySetInnerHTML={{
            __html:
              'if("serviceWorker" in navigator && location.hostname==="numerology.dawnstudio.app"){try{navigator.serviceWorker.register("/sw.js")}catch(e){}}',
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_JSONLD) }}
        />
      </head>
      <body>
        <SideNav />
        <div className="app">
          <AppShell>{children}</AppShell>
        </div>
        <TabBar />
        <DragScroll />
        <SelectionToolbar />
      </body>
    </html>
  );
}
