import type { Course, GradeItem } from "./types";

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
export function percentToGpaPoints(percent: number): number {
  if (percent >= 90) return 4.0;
  if (percent >= 85) return 4.0;
  if (percent >= 80) return 3.7;
  if (percent >= 77) return 3.3;
  if (percent >= 73) return 3.0;
  if (percent >= 70) return 2.7;
  if (percent >= 67) return 2.3;
  if (percent >= 63) return 2.0;
  if (percent >= 60) return 1.7;
  if (percent >= 57) return 1.3;
  if (percent >= 53) return 1.0;
  if (percent >= 50) return 0.7;
  return 0.0;
}

export function percentToLetterGrade(percent: number): string {
  if (percent >= 90) return "A+";
  if (percent >= 85) return "A";
  if (percent >= 80) return "A-";
  if (percent >= 77) return "B+";
  if (percent >= 73) return "B";
  if (percent >= 70) return "B-";
  if (percent >= 67) return "C+";
  if (percent >= 63) return "C";
  if (percent >= 60) return "C-";
  if (percent >= 57) return "D+";
  if (percent >= 53) return "D";
  if (percent >= 50) return "D-";
  return "F";
}

/** Credit-weighted GPA; courses need a grade (final % or weighted items) and credits > 0. */
export function gpaFromCourses(courses: Course[]): number | null {
  let weighted = 0;
  let credits = 0;

  for (const c of courses) {
    if (c.creditHours <= 0) continue;
    const avg = getCourseGradePercent(c);
    if (avg === null) continue;
    const pts = percentToGpaPoints(avg);
    weighted += pts * c.creditHours;
    credits += c.creditHours;
  }

  if (credits <= 0) return null;
  return weighted / credits;
}
