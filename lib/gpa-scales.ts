export type GpaScaleType = "4.0" | "9.0";

export type GradeRow = {
  letter: string;
  minPercent: number;
  gpaPoints: number;
};

export type GpaScaleConfig = {
  scaleType: GpaScaleType;
  grades: GradeRow[];
};

/** Current hardcoded 4.0 scale — becomes the default */
export const DEFAULT_4_SCALE: GradeRow[] = [
  { letter: "A+", minPercent: 90, gpaPoints: 4.0 },
  { letter: "A",  minPercent: 85, gpaPoints: 4.0 },
  { letter: "A-", minPercent: 80, gpaPoints: 3.7 },
  { letter: "B+", minPercent: 77, gpaPoints: 3.3 },
  { letter: "B",  minPercent: 73, gpaPoints: 3.0 },
  { letter: "B-", minPercent: 70, gpaPoints: 2.7 },
  { letter: "C+", minPercent: 67, gpaPoints: 2.3 },
  { letter: "C",  minPercent: 63, gpaPoints: 2.0 },
  { letter: "C-", minPercent: 60, gpaPoints: 1.7 },
  { letter: "D+", minPercent: 57, gpaPoints: 1.3 },
  { letter: "D",  minPercent: 53, gpaPoints: 1.0 },
  { letter: "D-", minPercent: 50, gpaPoints: 0.7 },
  { letter: "F",  minPercent: 0,  gpaPoints: 0.0 },
];

/** Ontario-style 9-point scale */
export const DEFAULT_9_SCALE: GradeRow[] = [
  { letter: "A+", minPercent: 90, gpaPoints: 9.0 },
  { letter: "A",  minPercent: 85, gpaPoints: 8.0 },
  { letter: "A-", minPercent: 80, gpaPoints: 7.0 },
  { letter: "B+", minPercent: 77, gpaPoints: 6.0 },
  { letter: "B",  minPercent: 73, gpaPoints: 5.0 },
  { letter: "B-", minPercent: 70, gpaPoints: 4.0 },
  { letter: "C+", minPercent: 67, gpaPoints: 3.0 },
  { letter: "C",  minPercent: 63, gpaPoints: 2.0 },
  { letter: "C-", minPercent: 60, gpaPoints: 1.0 },
  { letter: "D+", minPercent: 57, gpaPoints: 0.7 },
  { letter: "D",  minPercent: 53, gpaPoints: 0.3 },
  { letter: "D-", minPercent: 50, gpaPoints: 0.1 },
  { letter: "F",  minPercent: 0,  gpaPoints: 0.0 },
];

export const MAX_GPA: Record<GpaScaleType, number> = {
  "4.0": 4.0,
  "9.0": 9.0,
};

/**
 * Look up GPA points from a percentage using a custom grades table.
 * Grades must be sorted descending by minPercent (highest first).
 */
export function percentToGpaPointsFromScale(
  percent: number,
  grades: GradeRow[],
): number {
  for (const g of grades) {
    if (percent >= g.minPercent) return g.gpaPoints;
  }
  return 0;
}

/**
 * Look up letter grade from a percentage using a custom grades table.
 * Grades must be sorted descending by minPercent (highest first).
 */
export function percentToLetterFromScale(
  percent: number,
  grades: GradeRow[],
): string {
  for (const g of grades) {
    if (percent >= g.minPercent) return g.letter;
  }
  return "F";
}
