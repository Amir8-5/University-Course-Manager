export type GradeItemKind = "assignment" | "test" | "other";

export type CourseStatus = "completed" | "in_progress";

export type GradeItem = {
  id: string;
  kind: GradeItemKind;
  name: string;
  score: number | null;
  weight: number;
};

export type Course = {
  id: string;
  title: string;
  code: string;
  creditHours: number;
  status: CourseStatus;
  /** Final percentage (0–100) when status is completed; not used for in progress */
  finalPercent: number | null;
  items: GradeItem[];
};
