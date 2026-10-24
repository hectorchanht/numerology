import type { Metadata } from "next";
import { Suspense } from "react";
import { PageShell } from "@/components/PageShell";
import NameTool from "./name";

export const metadata: Metadata = {
  alternates: { canonical: "/name" },
  title: "姓名測分 · 洛書命理",
  description: "五格剖象姓名測分:康熙筆畫起天格人格地格外格總格,八十一數理評分。輸入名字即測,可分享成績表。",
  openGraph: {
    title: "姓名測分 · 洛書命理",
    description: "你個名幾多分？五格剖象 · 康熙筆畫，一分鐘即測。",
  },
};

export default function NamePage() {
  return (
    <PageShell>
      <Suspense>
        <NameTool />
      </Suspense>
    </PageShell>
  );
}
