"use client";

import { useEffect } from "react";
import type { Course } from "@/lib/types";
import { useCoursesStore } from "@/lib/store";
import { useGpaScaleStore } from "@/lib/gpa-store";
import { useAuth } from "@clerk/nextjs";
import { fetchCoursesAction, fetchGpaScaleAction } from "@/app/actions/db";

export function Providers({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      const run = async () => {
        try {
          // Fetch courses
          const remoteCourses = await fetchCoursesAction();
          useCoursesStore.setState({ courses: remoteCourses });

          // Fetch GPA scale
          const remoteGpa = await fetchGpaScaleAction();
          if (remoteGpa) {
            useGpaScaleStore.setState({ scaleType: remoteGpa.scaleType, grades: remoteGpa.grades });
          }
        } catch(e) { 
          console.error("Failed to hydrate from DB", e);
        }
      };
      run();
    } else {
      // Offline fallback: we could clear state when signed out or leave it default
      useCoursesStore.setState({ courses: [] });
      useGpaScaleStore.getState().resetToDefaults();
    }
  }, [isLoaded, isSignedIn]);

  return <>{children}</>;
}
