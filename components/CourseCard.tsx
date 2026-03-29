import Link from "next/link";
import type { Course } from "@/lib/types";
import { getCourseGradePercent, percentToLetterGrade } from "@/lib/grades";
import { useGpaScaleStore } from "@/lib/gpa-store";
import { Trash2 } from "lucide-react";
import { useCoursesStore } from "@/lib/store";

const COMPLETED_COLOR = "#9ca3af";

export function CourseCard({
  course,
  color,
}: {
  course: Course;
  /** Accent for in-progress courses only; completed uses gray */
  color?: string;
}) {
  const avg = getCourseGradePercent(course);
  const grades = useGpaScaleStore((s) => s.grades);
  const avgLabel =
    avg === null
      ? "—"
      : `${avg.toFixed(2)}% (${percentToLetterGrade(avg, grades)})`;
  const removeCourse = useCoursesStore((s) => s.removeCourse);
  const dotColor =
    course.status === "completed" ? COMPLETED_COLOR : color ?? "#2563eb";

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.confirm("Delete this course and all grades?")) {
      removeCourse(course.id);
    }
  };

  return (
    <Link
      href={`/course/${course.id}`}
      className="group flex flex-col justify-between border-[3px] border-border bg-card p-6 text-card-foreground shadow-[4px_4px_0px_0px_var(--foreground)] transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0px_0px_var(--foreground)] hover:bg-accent"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-2 pr-4">
          {dotColor && (
            <div
              className="mt-1.5 h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: dotColor }}
            />
          )}
          <div>
            <h2 className="font-semibold text-foreground">{course.title}</h2>
            {course.code ? (
              <p className="text-sm text-muted-foreground">{course.code}</p>
            ) : null}
            <p className="mt-1 text-xs text-muted-foreground">
              {course.status === "completed" ? "Completed" : "In progress"}
            </p>
          </div>
        </div>
        <div className="text-right text-sm">
          <p className="text-muted-foreground">
            {course.status === "completed" ? "Final" : "Average"}
          </p>
          <p className="font-medium tabular-nums text-foreground">{avgLabel}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {course.creditHours} credit{course.creditHours === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={handleDelete}
          className="-mb-2 -mr-2 hidden border-[3px] border-transparent p-2 font-black uppercase text-foreground transition-all hover:border-foreground hover:bg-destructive hover:text-destructive-foreground hover:shadow-[2px_2px_0px_0px_var(--foreground)] group-hover:block"
          aria-label="Delete course"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </Link>
  );
}
