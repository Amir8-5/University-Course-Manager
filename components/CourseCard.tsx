import Link from "next/link";
import type { Course } from "@/lib/types";
import { getCourseGradePercent, percentToLetterGrade } from "@/lib/grades";
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
  const avgLabel =
    avg === null
      ? "—"
      : `${avg.toFixed(1)}% (${percentToLetterGrade(avg)})`;
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
      className="group flex flex-col justify-between rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-accent/50"
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
          className="-mb-2 -mr-2 hidden rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive group-hover:block"
          aria-label="Delete course"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </Link>
  );
}
