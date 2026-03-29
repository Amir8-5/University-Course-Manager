"use client";

import { useState } from "react";
import type { CourseStatus } from "@/lib/types";
import { useCoursesStore } from "@/lib/store";

export function AddCourseDialog() {
  const addCourse = useCoursesStore((s) => s.addCourse);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<CourseStatus>("in_progress");
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [credits, setCredits] = useState("1");
  const [finalPercent, setFinalPercent] = useState("");

  const reset = () => {
    setStatus("in_progress");
    setTitle("");
    setCode("");
    setCredits("1");
    setFinalPercent("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseFloat(credits);
    const fp =
      status === "completed"
        ? (() => {
            const v = parseFloat(finalPercent);
            return Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : null;
          })()
        : null;
    addCourse({
      title,
      code,
      creditHours: Number.isFinite(n) ? n : 0,
      status,
      finalPercent: status === "completed" ? fp : null,
    });
    reset();
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
      >
        Add course
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={() => {
            reset();
            setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-course-title"
            className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-card-foreground shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="add-course-title" className="text-lg font-semibold text-foreground">
              New course
            </h2>
            <form onSubmit={submit} className="mt-4 flex flex-col gap-4">
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-foreground">Course status</legend>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <input
                      type="radio"
                      name="course-status"
                      checked={status === "in_progress"}
                      onChange={() => setStatus("in_progress")}
                      className="text-primary"
                    />
                    <span className="text-sm">In progress</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <input
                      type="radio"
                      name="course-status"
                      checked={status === "completed"}
                      onChange={() => setStatus("completed")}
                      className="text-primary"
                    />
                    <span className="text-sm">Completed</span>
                  </label>
                </div>
              </fieldset>

              {status === "completed" ? (
                <label className="block text-sm font-medium text-foreground">
                  Final grade (%)
                  <input
                    type="number"
                    required
                    min={0}
                    max={100}
                    step={0.01}
                    value={finalPercent}
                    onChange={(e) => setFinalPercent(e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-foreground outline-none ring-ring focus:ring-2"
                    placeholder="e.g. 87.5"
                  />
                </label>
              ) : null}

              <label className="block text-sm font-medium text-foreground">
                Title
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-foreground outline-none ring-ring focus:ring-2"
                  placeholder="e.g. Linear Algebra"
                />
              </label>
              <label className="block text-sm font-medium text-foreground">
                Code{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-foreground outline-none ring-ring focus:ring-2"
                  placeholder="e.g. MATH 201"
                />
              </label>
              <label className="block text-sm font-medium text-foreground">
                Credit hours
                <select
                  value={credits}
                  onChange={(e) => setCredits(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-foreground outline-none ring-ring focus:ring-2"
                >
                  <option value="0.5">0.5</option>
                  <option value="1">1</option>
                </select>
              </label>
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    setOpen(false);
                  }}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
