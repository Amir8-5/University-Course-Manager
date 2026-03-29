"use client";

import { useState } from "react";
import { useGpaScaleStore } from "@/lib/gpa-store";
import type { GpaScaleType } from "@/lib/gpa-scales";
import { Settings } from "lucide-react";

export function GpaScaleManager() {
  const [open, setOpen] = useState(false);
  const scaleType = useGpaScaleStore((s) => s.scaleType);
  const grades = useGpaScaleStore((s) => s.grades);
  const setScaleType = useGpaScaleStore((s) => s.setScaleType);
  const updateGradeRow = useGpaScaleStore((s) => s.updateGradeRow);
  const resetToDefaults = useGpaScaleStore((s) => s.resetToDefaults);

  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 border border-border bg-card px-3 py-2 text-sm font-bold uppercase text-foreground hover:bg-accent hover:text-accent-foreground"
      >
        <Settings className="h-4 w-4" />
        GPA Scale
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={close}
        >
          <div
            role="dialog"
            aria-labelledby="gpa-scale-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto border border-border bg-card p-6 text-card-foreground shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2
                id="gpa-scale-title"
                className="text-xl font-black uppercase tracking-wide text-foreground"
              >
                GPA Scale
              </h2>
              <button
                type="button"
                onClick={close}
                className="border border-border bg-card px-3 py-1.5 text-sm font-bold text-foreground hover:bg-accent hover:text-accent-foreground"
              >
                ✕
              </button>
            </div>

            {/* Scale type toggle */}
            <fieldset className="mb-6">
              <legend className="text-sm font-bold uppercase tracking-wide text-foreground mb-3">
                Scale Type
              </legend>
              <div className="flex gap-3">
                {(["4.0", "9.0"] as GpaScaleType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setScaleType(type)}
                    className={`flex-1 border px-4 py-3 text-base font-black uppercase transition-colors ${
                      scaleType === type
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    {type} Scale
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Editable grade table */}
            <div className="border border-border p-4 bg-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">
                  Grade Thresholds
                </h3>
                <button
                  type="button"
                  onClick={resetToDefaults}
                  className="border border-border bg-card px-3 py-1.5 text-xs font-bold uppercase text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  Reset
                </button>
              </div>

              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left">
                    <th className="px-3 py-2 font-bold uppercase text-foreground">
                      Letter
                    </th>
                    <th className="px-3 py-2 font-bold uppercase text-foreground">
                      Min %
                    </th>
                    <th className="px-3 py-2 font-bold uppercase text-foreground">
                      GPA Points
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((row, idx) => (
                    <tr
                      key={row.letter}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-3 py-2 font-black text-foreground">
                        {row.letter}
                      </td>
                      <td className="px-3 py-2">
                        {row.letter === "F" ? (
                          <span className="tabular-nums text-muted-foreground">
                            0
                          </span>
                        ) : (
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            value={row.minPercent}
                            onChange={(e) => {
                              const v = parseInt(e.target.value);
                              if (Number.isFinite(v)) {
                                updateGradeRow(idx, {
                                  minPercent: Math.min(100, Math.max(0, v)),
                                });
                              }
                            }}
                            className="w-20 border border-input bg-background px-2 py-1 tabular-nums text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          />
                        )}
                      </td>
                      <td className="px-3 py-2 tabular-nums text-foreground font-bold">
                        {row.gpaPoints.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Changes are saved automatically and apply to all courses.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
