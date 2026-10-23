import { PageShell } from "@/components/PageShell";

/** 易經組統一佈局:組內所有頁(yijing/meihua/cases/gua/liuyao/academy)共用同一個 padding shell。 */
export default function YijingLayout({ children }: { children: React.ReactNode }) {
  return <PageShell>{children}</PageShell>;
}
