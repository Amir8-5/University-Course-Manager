import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GpaScaleType, GradeRow, GpaScaleConfig } from "./gpa-scales";
import { DEFAULT_4_SCALE, DEFAULT_9_SCALE } from "./gpa-scales";

type GpaScaleState = GpaScaleConfig & {
  setScaleType: (type: GpaScaleType) => void;
  updateGradeRow: (index: number, patch: Partial<Pick<GradeRow, "minPercent">>) => void;
  resetToDefaults: () => void;
};

function defaultsForScale(type: GpaScaleType): GradeRow[] {
  return type === "9.0"
    ? DEFAULT_9_SCALE.map((r) => ({ ...r }))
    : DEFAULT_4_SCALE.map((r) => ({ ...r }));
}

export const useGpaScaleStore = create<GpaScaleState>()(
  persist(
    (set, get) => ({
      scaleType: "4.0" as GpaScaleType,
      grades: defaultsForScale("4.0"),

      setScaleType: (type) =>
        set({ scaleType: type, grades: defaultsForScale(type) }),

      updateGradeRow: (index, patch) =>
        set((s) => {
          const grades = s.grades.map((g, i) => {
            if (i !== index) return g;
            return { ...g, ...patch };
          });
          return { grades };
        }),

      resetToDefaults: () =>
        set((s) => ({ grades: defaultsForScale(s.scaleType) })),
    }),
    { name: "course-manager:gpa-scale", skipHydration: true },
  ),
);
