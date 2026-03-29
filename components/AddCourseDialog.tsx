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
        className="border-[3px] border-foreground bg-primary px-4 py-2.5 font-black uppercase text-primary-foreground transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[4px_4px_0_0_var(--foreground)]"
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
            className="w-full max-w-md border-[3px] border-foreground bg-card p-6 text-card-foreground shadow-[8px_8px_0_0_var(--foreground)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="add-course-title" className="text-xl font-black uppercase text-foreground">
              New course
            </h2>
            <form onSubmit={submit} className="mt-4 flex flex-col gap-4">
              <fieldset className="space-y-2">
                <legend className="text-sm font-black uppercase text-foreground">Course status</legend>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <label className="flex cursor-pointer items-center gap-2 border-[3px] border-border px-3 py-2 font-bold uppercase transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                    <input
                      type="radio"
                      name="course-status"
                      checked={status === "in_progress"}
                      onChange={() => setStatus("in_progress")}
                      className="text-primary"
                    />
                    <span className="text-sm">In progress</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 border-[3px] border-border px-3 py-2 font-bold uppercase transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/10">
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
                <label className="block text-sm font-black uppercase text-foreground">
                  Final grade (%)
                  <input
                    type="number"
                    required
                    min={0}
                    max={100}
                    step={0.01}
                    value={finalPercent}
                    onChange={(e) => setFinalPercent(e.target.value)}
                    className="mt-1 w-full border-[3px] border-foreground bg-background px-3 py-2 font-bold text-foreground outline-none focus:border-primary focus:shadow-[4px_4px_0_0_var(--primary)]"
                    placeholder="e.g. 87.5"
                  />
                </label>
              ) : null}

              <label className="block text-sm font-black uppercase text-foreground">
                Title
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full border-[3px] border-foreground bg-background px-3 py-2 font-bold text-foreground outline-none focus:border-primary focus:shadow-[4px_4px_0_0_var(--primary)]"
                  placeholder="e.g. Linear Algebra"
                />
              </label>
              <label className="block text-sm font-black uppercase text-foreground">
                Code{" "}
                <span className="font-bold text-muted-foreground uppercase">(optional)</span>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="mt-1 w-full border-[3px] border-foreground bg-background px-3 py-2 font-bold text-foreground outline-none focus:border-primary focus:shadow-[4px_4px_0_0_var(--primary)]"
                  placeholder="e.g. MATH 201"
                />
              </label>
              <label className="block text-sm font-black uppercase text-foreground">
                Credit hours
                <select
                  value={credits}
                  onChange={(e) => setCredits(e.target.value)}
                  className="mt-1 w-full border-[3px] border-foreground bg-background px-3 py-2 font-bold text-foreground outline-none focus:border-primary focus:shadow-[4px_4px_0_0_var(--primary)]"
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
                  className="border-[3px] border-border px-4 py-2 font-black uppercase text-foreground hover:bg-muted transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[4px_4px_0_0_var(--foreground)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="border-[3px] border-foreground bg-primary px-4 py-2 font-black uppercase text-primary-foreground hover:bg-primary/90 transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[4px_4px_0_0_var(--foreground)]"
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
