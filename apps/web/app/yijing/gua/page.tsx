import type { Metadata } from "next";
import GuaLibrary from "./library";

export const metadata: Metadata = {
  alternates: { canonical: "/yijing/gua" },
  title: "六十四卦 · 卦辭爻辭全覽",
  description:
    "六十四卦卦庫:文王卦序,搜卦名/拼音/英文/卦序號,看卦辭、六爻爻辭、大象辭與今解(事業/感情/財運/健康/建議)。",
};

export default function GuaPage() {
  return (
    <div className="shell">
      <GuaLibrary />
    </div>
  );
}
