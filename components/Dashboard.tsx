"use client";

import { useMemo } from "react";
import { useCoursesStore } from "@/lib/store";
import { useGpaScaleStore } from "@/lib/gpa-store";
import { gpaFromCourses } from "@/lib/grades";
import { MAX_GPA } from "@/lib/gpa-scales";
import { AddCourseDialog } from "./AddCourseDialog";
import { CourseCard } from "./CourseCard";
import { GpaChart, COLORS } from "./GpaChart";
import { GpaScaleManager } from "./GpaScaleManager";

export function Dashboard() {
  const courses = useCoursesStore((s) => s.courses);
  const scaleType = useGpaScaleStore((s) => s.scaleType);
  const grades = useGpaScaleStore((s) => s.grades);
  const gpa = gpaFromCourses(courses, grades);
  const maxGpa = MAX_GPA[scaleType];

  const { inProgress, completed } = useMemo(() => {
    const inProgress = courses.filter((c) => c.status === "in_progress");
    const completed = courses.filter((c) => c.status === "completed");
    return { inProgress, completed };
  }, [courses]);

  const hasAny = courses.length > 0;

  return (
    <main className="mx-auto max-w-4xl flex-1 px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Dashboard
        </h1>
        <GpaScaleManager />
      </div>

      <section className="mb-10 flex justify-center">
        <div className="flex w-full items-center justify-center border-[3px] border-border bg-card p-8 shadow-[8px_8px_0px_0px_var(--foreground)] sm:w-auto">
          <GpaChart courses={courses} gpa={gpa} maxGpa={maxGpa} grades={grades} />
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-widest text-foreground">
            Courses
          </h2>
          <AddCourseDialog />
        </div>

        {!hasAny ? (
          <div className="border-[3px] border-dashed border-border bg-card px-6 py-12 text-center text-lg font-black uppercase text-foreground shadow-[4px_4px_0px_0px_var(--foreground)]">
            No courses yet. Add one to get started.
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-foreground">
                In progress
              </h3>
              {inProgress.length === 0 ? (
                <p className="border-[3px] border-dashed border-border bg-card px-4 py-8 text-center text-sm font-black uppercase text-foreground shadow-[4px_4px_0px_0px_var(--foreground)]">
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
              <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-foreground">
                Completed
              </h3>
              {completed.length === 0 ? (
                <p className="border-[3px] border-dashed border-border bg-card px-4 py-8 text-center text-sm font-black uppercase text-foreground shadow-[4px_4px_0px_0px_var(--foreground)]">
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
