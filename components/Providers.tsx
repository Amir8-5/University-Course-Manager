"use client";

import { useEffect } from "react";
import type { Course } from "@/lib/types";
import { useCoursesStore } from "@/lib/store";
import { useGpaScaleStore } from "@/lib/gpa-store";

function migrateLegacyCourses(courses: Course[]): Course[] {
  return courses.map((c) => {
    const raw = c as Course & {
      status?: Course["status"];
      finalPercent?: number | null;
    };
    if (raw.status === "completed" || raw.status === "in_progress") {
      return {
        ...raw,
        items: Array.isArray(raw.items) ? raw.items : [],
        finalPercent:
          raw.status === "completed" ? (raw.finalPercent ?? null) : null,
      };
    }
    return {
      ...raw,
      status: "in_progress" as const,
      finalPercent: null,
      items: Array.isArray(raw.items) ? raw.items : [],
    };
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const run = async () => {
      await Promise.resolve(useCoursesStore.persist.rehydrate());
      await Promise.resolve(useGpaScaleStore.persist.rehydrate());
      const courses = useCoursesStore.getState().courses;
      const migrated = migrateLegacyCourses(courses);
      const changed =
        migrated.length !== courses.length ||
        migrated.some((m, i) => JSON.stringify(m) !== JSON.stringify(courses[i]));
      if (changed) {
        useCoursesStore.setState({ courses: migrated });
      }
    };
    void run();
  }, []);

  return children;
}
