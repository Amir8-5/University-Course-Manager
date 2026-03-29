import { CourseDetail } from "@/components/CourseDetail";

type PageProps = { params: Promise<{ id: string }> };

export default async function CoursePage({ params }: PageProps) {
  const { id } = await params;
  return <CourseDetail courseId={id} />;
}
