"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCoursesStore } from "@/lib/store";
import {
  courseAveragePercent,
  getCourseGradePercent,
  percentToGpaPoints,
  percentToLetterGrade,
} from "@/lib/grades";
import { GradeItemRow } from "./GradeItemRow";
import { SyllabusImportDialog } from "./SyllabusImportDialog";

type Props = { courseId: string };

export function CourseDetail({ courseId }: Props) {
  const router = useRouter();
  const course = useCoursesStore((s) => s.courses.find((c) => c.id === courseId));
  const updateCourseMeta = useCoursesStore((s) => s.updateCourseMeta);
  const removeCourse = useCoursesStore((s) => s.removeCourse);
  const addGradeItem = useCoursesStore((s) => s.addGradeItem);

  if (!course) {
    return (
      <main className="mx-auto max-w-4xl flex-1 px-4 py-16 text-center sm:px-6">
        <h1 className="text-xl font-semibold text-foreground">Course not found</h1>
        <Link
          href="/"
          className="mt-4 inline-block text-primary underline-offset-4 hover:underline"
        >
          Back to dashboard
        </Link>
      </main>
    );
  }

  const displayPercent = getCourseGradePercent(course);
  const avg =
    course.status === "in_progress" ? courseAveragePercent(course.items) : displayPercent;
  const gradedItems = course.items.filter(
    (i) => i.score !== null && !Number.isNaN(i.score) && i.weight > 0,
  );
  const sumGradedWeights = gradedItems.reduce((s, i) => s + i.weight, 0);
  const totalItemWeights = course.items.reduce((s, i) => s + i.weight, 0);

  const deleteCourse = () => {
    if (typeof window !== "undefined" && window.confirm("Delete this course and all grades?")) {
      removeCourse(course.id);
      router.push("/");
    }
  };

  return (
    <main className="mx-auto max-w-4xl flex-1 px-4 py-8 sm:px-6">
      <Link href="/" className="text-sm font-medium text-primary hover:underline">
        ← Dashboard
      </Link>

      <div className="mt-6 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 space-y-3">
          <label className="block text-sm font-medium text-muted-foreground">
            Status
            <select
              value={course.status}
              onChange={(e) =>
                updateCourseMeta(course.id, {
                  status: e.target.value as "completed" | "in_progress",
                  finalPercent:
                    e.target.value === "completed" ? course.finalPercent : undefined,
                })
              }
              className="mt-1 block w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-foreground outline-none ring-ring focus:ring-2"
            >
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-muted-foreground">
            Title
            <input
              value={course.title}
              onChange={(e) => updateCourseMeta(course.id, { title: e.target.value })}
              className="mt-1 block w-full max-w-xl rounded-md border border-input bg-background px-3 py-2 text-lg font-semibold text-foreground outline-none ring-ring focus:ring-2"
            />
          </label>
          <div className="flex flex-wrap gap-4">
            <label className="block text-sm font-medium text-muted-foreground">
              Code
              <input
                value={course.code}
                onChange={(e) => updateCourseMeta(course.id, { code: e.target.value })}
                className="mt-1 block w-40 rounded-md border border-input bg-background px-3 py-2 text-foreground outline-none ring-ring focus:ring-2"
                placeholder="Optional"
              />
            </label>
            <label className="block text-sm font-medium text-muted-foreground">
              Credit hours
              <select
                value={course.creditHours}
                onChange={(e) => {
                  const n = parseFloat(e.target.value);
                  updateCourseMeta(course.id, {
                    creditHours: Number.isFinite(n) ? n : 0,
                  });
                }}
                className="mt-1 block w-28 rounded-md border border-input bg-background px-3 py-2 tabular-nums text-foreground outline-none ring-ring focus:ring-2"
              >
                <option value="0.5">0.5</option>
                <option value="1">1</option>
              </select>
            </label>
          </div>
        </div>
        <button
          type="button"
          onClick={deleteCourse}
          className="shrink-0 rounded-lg border border-destructive/50 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
        >
          Delete course
        </button>
      </div>

      {course.status === "completed" ? (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Final grade
          </h2>
          <label className="block max-w-xs text-sm font-medium text-foreground">
            Final percentage
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={course.finalPercent === null ? "" : course.finalPercent}
              onChange={(e) => {
                const v = e.target.value;
                updateCourseMeta(course.id, {
                  finalPercent: v === "" ? null : Number(v),
                });
              }}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 tabular-nums text-foreground outline-none ring-ring focus:ring-2"
            />
          </label>
          <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4 text-sm">
            <p className="font-semibold text-foreground">
              Course grade:{" "}
              <span className="tabular-nums">
                {displayPercent === null ? "—" : `${displayPercent.toFixed(2)}%`}
              </span>
              {displayPercent !== null ? (
                <span className="ml-2 font-normal text-muted-foreground">
                  ({percentToLetterGrade(displayPercent)},{" "}
                  {percentToGpaPoints(displayPercent).toFixed(2)} GPA points)
                </span>
              ) : null}
            </p>
            <p className="mt-2 text-muted-foreground">
              Completed courses use your final percentage for GPA. Switch to &quot;In
              progress&quot; to track assignments and tests instead.
            </p>
          </div>
        </section>
      ) : (
        <section className="mt-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Assignments & tests
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <SyllabusImportDialog
                courseId={course.id}
                existingItemCount={course.items.length}
              />
              <button
                type="button"
                onClick={() => addGradeItem(course.id, "assignment")}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
              >
                Add assignment
              </button>
              <button
                type="button"
                onClick={() => addGradeItem(course.id, "test")}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
              >
                Add test
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
            <table className="w-full min-w-[36rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                  <th className="px-3 py-3 font-medium">Type</th>
                  <th className="px-3 py-3 font-medium">Name</th>
                  <th className="px-3 py-3 font-medium">Grade (%)</th>
                  <th className="px-3 py-3 font-medium">Weight (%)</th>
                  <th className="px-3 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-foreground">
                {course.items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                      No items yet. Add an assignment or test.
                    </td>
                  </tr>
                ) : (
                  course.items.map((item) => (
                    <GradeItemRow key={item.id} courseId={course.id} item={item} />
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4 text-sm">
            <p className="font-semibold text-foreground">
              Course average:{" "}
              <span className="tabular-nums">
                {avg === null ? "—" : `${avg.toFixed(2)}%`}
              </span>
              {avg !== null ? (
                <span className="ml-2 font-normal text-muted-foreground">
                  ({percentToLetterGrade(avg)}, {percentToGpaPoints(avg).toFixed(2)} GPA points)
                </span>
              ) : null}
            </p>
            <p className="mt-2 text-muted-foreground">
              Averages use only rows with a grade and positive weight; those weights are
              renormalized so the average matches a weighted mean of entered scores.
            </p>
            {course.items.length > 0 ? (
              <p className="mt-1 text-muted-foreground">
                Graded rows: {gradedItems.length} · Sum of their weights:{" "}
                <span className="tabular-nums">{sumGradedWeights.toFixed(1)}%</span>
                {course.items.some((i) => i.weight > 0) ? (
                  <>
                    {" "}
                    · All rows weight total:{" "}
                    <span className="tabular-nums">{totalItemWeights.toFixed(1)}%</span>
                  </>
                ) : null}
              </p>
            ) : null}
          </div>
        </section>
      )}
    </main>
  );
}
