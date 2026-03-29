import type { Course, GradeItem } from "./types";
import type { GradeRow } from "./gpa-scales";
import {
  DEFAULT_4_SCALE,
  percentToGpaPointsFromScale,
  percentToLetterFromScale,
} from "./gpa-scales";

/** Weighted average over items with a score; weights renormalized to graded items only. */
export function courseAveragePercent(items: GradeItem[]): number | null {
  const graded = items.filter(
    (i) => i.score !== null && !Number.isNaN(i.score) && i.weight > 0,
  );
  if (graded.length === 0) return null;

  const sumW = graded.reduce((s, i) => s + i.weight, 0);
  if (sumW <= 0) return null;

  const weighted = graded.reduce((s, i) => s + (i.score as number) * i.weight, 0);
  return weighted / sumW;
}

/** Final or computed course percentage for GPA and display. */
export function getCourseGradePercent(course: Course): number | null {
  if (course.status === "completed") {
    if (course.finalPercent === null || Number.isNaN(course.finalPercent)) {
      return null;
    }
    return Math.min(100, Math.max(0, course.finalPercent));
  }
  return courseAveragePercent(course.items);
}

/** Specific grading scale from percentage (0–100). */
export function percentToGpaPoints(
  percent: number,
  grades: GradeRow[] = DEFAULT_4_SCALE,
): number {
  return percentToGpaPointsFromScale(percent, grades);
}

export function percentToLetterGrade(
  percent: number,
  grades: GradeRow[] = DEFAULT_4_SCALE,
): string {
  return percentToLetterFromScale(percent, grades);
}

/** Credit-weighted GPA; courses need a grade (final % or weighted items) and credits > 0. */
export function gpaFromCourses(
  courses: Course[],
  grades: GradeRow[] = DEFAULT_4_SCALE,
): number | null {
  let weighted = 0;
  let credits = 0;

  for (const c of courses) {
    if (c.creditHours <= 0) continue;
    const avg = getCourseGradePercent(c);
    if (avg === null) continue;
    const pts = percentToGpaPoints(avg, grades);
    weighted += pts * c.creditHours;
    credits += c.creditHours;
  }

  if (credits <= 0) return null;
  return weighted / credits;
}
