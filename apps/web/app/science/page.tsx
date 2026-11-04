import type { Metadata } from "next";
import ScienceTool from "./science";

export const metadata: Metadata = {
  alternates: { canonical: "/science" },
  title: "科學專區 · 洛書命理",
  description: "命理說法的科學研究結論,附基率模擬器:多個體系隨機吻合有多常見,模擬與二項分佈解析解並排對照。",
  openGraph: {
    title: "科學專區 · 洛書命理",
    description: "吻合是巧合嗎?先看基準率。",
  },
};

export default function SciencePage() {
  return <ScienceTool />;
}
