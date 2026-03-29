import { create } from "zustand";
import { persist } from "zustand/middleware";
import { COURSES_STORAGE_KEY } from "./constants";
import type { Course, GradeItem, GradeItemKind } from "./types";

type AddCourseInput = {
  title: string;
  code: string;
  creditHours: number;
  status: Course["status"];
  finalPercent: number | null;
};

type CoursesState = {
  courses: Course[];
  addCourse: (input: AddCourseInput) => void;
  removeCourse: (id: string) => void;
  updateCourseMeta: (
    id: string,
    patch: Partial<
      Pick<Course, "title" | "code" | "creditHours" | "status" | "finalPercent">
    >,
  ) => void;
  addGradeItem: (courseId: string, kind?: GradeItemKind) => void;
  updateGradeItem: (
    courseId: string,
    itemId: string,
    patch: Partial<Pick<GradeItem, "kind" | "name" | "score" | "weight">>,
  ) => void;
  removeGradeItem: (courseId: string, itemId: string) => void;
  importGradeItems: (
    courseId: string,
    rows: Array<{ name: string; kind: GradeItemKind; weight: number }>,
    mode: "append" | "replace",
  ) => void;
};

function newId() {
  return crypto.randomUUID();
}

export const useCoursesStore = create<CoursesState>()(
  persist(
    (set) => ({
      courses: [],

      addCourse: ({ title, code, creditHours, status, finalPercent }) =>
        set((s) => ({
          courses: [
            ...s.courses,
            {
              id: newId(),
              title: title.trim() || "Untitled course",
              code: code.trim(),
              creditHours: Math.max(0, creditHours),
              status,
              finalPercent:
                status === "completed" && finalPercent !== null && Number.isFinite(finalPercent)
                  ? Math.min(100, Math.max(0, finalPercent))
                  : null,
              items: [],
            },
          ],
        })),

      removeCourse: (id) =>
        set((s) => ({ courses: s.courses.filter((c) => c.id !== id) })),

      updateCourseMeta: (id, patch) =>
        set((s) => ({
          courses: s.courses.map((c) => {
            if (c.id !== id) return c;
            const status = patch.status !== undefined ? patch.status : c.status;
            let finalPercent = c.finalPercent;
            let items = c.items;

            if (patch.status === "completed") {
              items = [];
              if (patch.finalPercent !== undefined) {
                const fp = patch.finalPercent;
                finalPercent =
                  fp !== null && Number.isFinite(fp) ? Math.min(100, Math.max(0, fp)) : null;
              } else {
                finalPercent = c.finalPercent;
              }
            } else if (patch.status === "in_progress") {
              finalPercent = null;
            } else if (patch.finalPercent !== undefined && status === "completed") {
              const fp = patch.finalPercent;
              finalPercent =
                fp !== null && Number.isFinite(fp) ? Math.min(100, Math.max(0, fp)) : null;
            }

            return {
              ...c,
              title:
                patch.title !== undefined
                  ? patch.title.trim() || "Untitled course"
                  : c.title,
              code: patch.code !== undefined ? patch.code.trim() : c.code,
              creditHours:
                patch.creditHours !== undefined
                  ? Math.max(0, patch.creditHours)
                  : c.creditHours,
              status,
              finalPercent,
              items,
            };
          }),
        })),

      addGradeItem: (courseId, kind = "assignment") =>
        set((s) => ({
          courses: s.courses.map((c) => {
            if (c.id !== courseId || c.status !== "in_progress") return c;
            return {
              ...c,
              items: [
                ...c.items,
                {
                  id: newId(),
                  kind,
                  name: "",
                  score: null,
                  weight: 0,
                },
              ],
            };
          }),
        })),

      updateGradeItem: (courseId, itemId, patch) =>
        set((s) => ({
          courses: s.courses.map((c) => {
            if (c.id !== courseId || c.status !== "in_progress") return c;
            return {
              ...c,
              items: c.items.map((item) => {
                if (item.id !== itemId) return item;
                const next = { ...item, ...patch };
                if (patch.score !== undefined) {
                  if (patch.score === null) next.score = null;
                  else {
                    const n = Number(patch.score);
                    next.score = Number.isFinite(n)
                      ? Math.min(100, Math.max(0, n))
                      : null;
                  }
                }
                if (patch.weight !== undefined) {
                  const w = Number(patch.weight);
                  next.weight = Number.isFinite(w) ? Math.min(100, Math.max(0, w)) : 0;
                }
                if (patch.name !== undefined) next.name = patch.name;
                if (patch.kind !== undefined) next.kind = patch.kind;
                return next;
              }),
            };
          }),
        })),

      removeGradeItem: (courseId, itemId) =>
        set((s) => ({
          courses: s.courses.map((c) =>
            c.id === courseId && c.status === "in_progress"
              ? { ...c, items: c.items.filter((i) => i.id !== itemId) }
              : c,
          ),
        })),

      importGradeItems: (courseId, rows, mode) =>
        set((s) => ({
          courses: s.courses.map((c) => {
            if (c.id !== courseId || c.status !== "in_progress") return c;
            const newRows: GradeItem[] = rows.map((r) => ({
              id: newId(),
              kind: r.kind,
              name: r.name.trim() || "Untitled",
              score: null,
              weight: Math.min(100, Math.max(0, Number.isFinite(r.weight) ? r.weight : 0)),
            }));
            if (mode === "replace") {
              return { ...c, items: newRows };
            }
            return { ...c, items: [...c.items, ...newRows] };
          }),
        })),
    }),
    { name: COURSES_STORAGE_KEY, skipHydration: true },
  ),
);
