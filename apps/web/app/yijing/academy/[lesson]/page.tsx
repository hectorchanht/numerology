import type { Metadata } from "next";
import { ACADEMY_LESSONS, getLesson } from "../lessons";
import { LessonView } from "./LessonView";

export function generateStaticParams() {
  return ACADEMY_LESSONS.map((l) => ({ lesson: l.id }));
}

export function generateMetadata({ params }: { params: { lesson: string } }): Metadata {
  const l = getLesson(params.lesson);
  return {
    title: l ? `易經學院 · ${l.title}` : "易經學院",
    description: l?.sub ?? "易經學院課程",
    alternates: { canonical: `/yijing/academy/${params.lesson}` },
  };
}

/** 單課頁(服務端外殼,靜態生成四課)。 */
export default function AcademyLessonPage({ params }: { params: { lesson: string } }) {
  return (
    <div className="shell">
      <LessonView lessonId={params.lesson} />
    </div>
  );
}
