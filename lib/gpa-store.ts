"use client";

import { create } from "zustand";
import type { GpaScaleType, GradeRow, GpaScaleConfig } from "./gpa-scales";
import { DEFAULT_4_SCALE, DEFAULT_9_SCALE } from "./gpa-scales";
import { saveGpaScaleAction } from "@/app/actions/db";

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

export const useGpaScaleStore = create<GpaScaleState>()((set, get) => ({
  scaleType: "4.0" as GpaScaleType,
  grades: defaultsForScale("4.0"),

  setScaleType: (type) => {
    const grades = defaultsForScale(type);
    set({ scaleType: type, grades });
    saveGpaScaleAction(type, grades).catch(console.error);
  },

  updateGradeRow: (index, patch) => {
    set((s) => {
      const grades = s.grades.map((g, i) => {
        if (i !== index) return g;
        return { ...g, ...patch };
      });
      return { grades };
    });
    saveGpaScaleAction(get().scaleType, get().grades).catch(console.error);
  },

  resetToDefaults: () => {
    const grades = defaultsForScale(get().scaleType);
    set({ grades });
    saveGpaScaleAction(get().scaleType, grades).catch(console.error);
  },
}));
