import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import QimenTool from "./qimen";

export const metadata: Metadata = {
  alternates: { canonical: "/qimen" },
  title: "奇門遁甲 · 洛書命理",
  description: "奇門遁甲時家轉盤（拆補定局）：九宮、九星、八門、格局一盤睇晒。傳統民俗趣味參考，結果可分享。",
  openGraph: {
    title: "奇門遁甲 · 洛書命理",
    description: "問事起局，九星八門即排。",
  },
};

export default function QimenPage() {
  return (
    <PageShell>
      <QimenTool />
    </PageShell>
  );
}
