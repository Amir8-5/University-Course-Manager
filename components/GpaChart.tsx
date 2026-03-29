"use client";

import { useMemo, useState } from "react";
import type { Course } from "@/lib/types";
import { getCourseGradePercent, percentToGpaPoints } from "@/lib/grades";

/** Distinct colors for in-progress courses only */
export const COLORS = [
  "#6d28d9",
  "#2563eb",
  "#059669",
  "#d97706",
  "#dc2626",
  "#db2777",
  "#0891b2",
  "#4f46e5",
];

/** Single color for all completed-course segments in the chart */
export const COMPLETED_GPA_COLOR = "#9ca3af";

type Props = {
  courses: Course[];
  gpa: number | null;
};

export function GpaChart({ courses, gpa }: Props) {
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  const contributions = useMemo(() => {
    const validCourses = courses.filter(
      (c) => c.creditHours > 0 && getCourseGradePercent(c) !== null,
    );

    if (validCourses.length === 0) {
      return [] as Array<{
        id: string;
        label: string;
        contribution: number;
        chartColor: string;
      }>;
    }

    const totalCredits = validCourses.reduce((s, c) => s + c.creditHours, 0);

    let inProgressIndex = 0;
    return validCourses.map((c) => {
      const avg = getCourseGradePercent(c) as number;
      const pts = percentToGpaPoints(avg);
      const contribution = (pts * c.creditHours) / totalCredits;
      const chartColor =
        c.status === "completed"
          ? COMPLETED_GPA_COLOR
          : COLORS[inProgressIndex++ % COLORS.length];
      const label =
        c.status === "completed" ? `${c.title} (completed)` : c.title;
      return {
        id: c.id,
        label,
        contribution,
        chartColor,
      };
    });
  }, [courses]);

  if (contributions.length === 0) {
    return (
      <div className="flex h-48 w-48 flex-col items-center justify-center rounded-full border-8 border-muted p-4 text-center text-sm text-muted-foreground">
        Add grades to see chart
      </div>
    );
  }

  const size = 220;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={strokeWidth}
          />

          {contributions.map((c) => {
            const fraction = c.contribution / 4.0;
            const dashLength = fraction * circumference;
            const dashGap = circumference - dashLength;
            const offset = currentOffset;
            currentOffset += dashLength;

            return (
              <circle
                key={c.id}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={c.chartColor}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dashLength} ${dashGap}`}
                strokeDashoffset={-offset}
                className="cursor-pointer transition-all duration-300 ease-in-out hover:stroke-[32px]"
                onMouseEnter={() => setHoveredLabel(c.label)}
                onMouseLeave={() => setHoveredLabel(null)}
                style={{
                  opacity: hoveredLabel && hoveredLabel !== c.label ? 0.25 : 1,
                }}
              />
            );
          })}
        </svg>

        {!hoveredLabel && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-bold tabular-nums text-foreground">
              {(gpa ?? 0).toFixed(2)}
            </span>
            <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              GPA
            </span>
          </div>
        )}

        {hoveredLabel && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4">
            <span className="max-w-[12rem] rounded-lg border border-border bg-background/95 px-4 py-2 text-center text-sm font-semibold leading-tight text-foreground shadow-2xl backdrop-blur-md">
              {hoveredLabel}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
