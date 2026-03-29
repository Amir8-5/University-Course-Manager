"use client";

import { useMemo } from "react";
import { useCoursesStore } from "@/lib/store";
import { gpaFromCourses } from "@/lib/grades";
import { AddCourseDialog } from "./AddCourseDialog";
import { CourseCard } from "./CourseCard";
import { GpaChart, COLORS } from "./GpaChart";

export function Dashboard() {
  const courses = useCoursesStore((s) => s.courses);
  const gpa = gpaFromCourses(courses);

  const { inProgress, completed } = useMemo(() => {
    const inProgress = courses.filter((c) => c.status === "in_progress");
    const completed = courses.filter((c) => c.status === "completed");
    return { inProgress, completed };
  }, [courses]);

  const hasAny = courses.length > 0;

  return (
    <main className="mx-auto max-w-4xl flex-1 px-4 py-8 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Dashboard
        </h1>
      </div>

      <section className="mb-10 flex justify-center">
        <div className="flex w-full items-center justify-center rounded-lg border border-border bg-card p-8 shadow-sm sm:w-auto">
          <GpaChart courses={courses} gpa={gpa} />
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Courses
          </h2>
          <AddCourseDialog />
        </div>

        {!hasAny ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 px-6 py-12 text-center text-muted-foreground">
            No courses yet. Add one to get started.
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                In progress
              </h3>
              {inProgress.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                  No in-progress courses.
                </p>
              ) : (
                <ul className="grid gap-4 sm:grid-cols-2">
                  {inProgress.map((course, i) => (
                    <li key={course.id}>
                      <CourseCard course={course} color={COLORS[i % COLORS.length]} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Completed
              </h3>
              {completed.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                  No completed courses.
                </p>
              ) : (
                <ul className="grid gap-4 sm:grid-cols-2">
                  {completed.map((course) => (
                    <li key={course.id}>
                      <CourseCard course={course} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
