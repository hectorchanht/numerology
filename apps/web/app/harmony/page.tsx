import type { Metadata } from "next";
import HarmonyTool from "./harmony";

export const metadata: Metadata = {
  alternates: { canonical: "/harmony" },
  title: "數與和諧 · 洛書命理",
  description: "柏拉圖世界靈魂數列、十二律三分損益、Nicomachus 形數與完全數、正多面體與四元素、Fideler gematria 數值關係——用圖重算原典的數。",
  openGraph: {
    title: "數與和諧 · 洛書命理",
    description: "古希臘與中國都用整數比解釋音律與宇宙。",
  },
};

export default function HarmonyPage() {
  return <HarmonyTool />;
}
