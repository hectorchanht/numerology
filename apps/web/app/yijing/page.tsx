import type { Metadata } from "next";
import YijingTool from "./tool";

export const metadata: Metadata = {
  title: "易經占卦 · 三錢起卦",
  description:
    "三錢起卦占卦工具:六爻由下而上,得本卦、變卦、互卦與動爻爻辭。問題只存於本頁,不會上傳;AI 解卦即將推出。",
};

export default function YijingPage() {
  return (
    <div className="shell">
      <YijingTool />
    </div>
  );
}
