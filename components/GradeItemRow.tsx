"use client";

import { useState } from "react";
import type { GradeItem } from "@/lib/types";
import { useCoursesStore } from "@/lib/store";
import { Trash2, Pencil, Check } from "lucide-react";

type Props = {
  courseId: string;
  item: GradeItem;
};

const KIND_LABEL: Record<GradeItem["kind"], string> = {
  assignment: "Assignment",
  test: "Test",
  other: "Other",
};

export function GradeItemRow({ courseId, item }: Props) {
  const updateGradeItem = useCoursesStore((s) => s.updateGradeItem);
  const removeGradeItem = useCoursesStore((s) => s.removeGradeItem);
  const [isEditing, setIsEditing] = useState(item.name === "");

  return (
    <tr className="group border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
      <td className="py-4 pl-4 pr-2 align-middle">
        {isEditing ? (
            <select
              value={item.kind}
              onChange={(e) =>
                updateGradeItem(courseId, item.id, {
                  kind: e.target.value as GradeItem["kind"],
                })
              }
              className="w-full min-w-[8rem] border-[3px] border-foreground bg-background px-2 py-1.5 text-sm font-bold uppercase text-foreground outline-none focus:border-primary focus:shadow-[4px_4px_0_0_var(--primary)]"
            >
              <option value="assignment">Assignment</option>
              <option value="test">Test</option>
              <option value="other">Other</option>
            </select>
          ) : (
            <span className="text-foreground font-black uppercase tracking-wider">{KIND_LABEL[item.kind]}</span>
          )}
      </td>
      <td className="py-4 px-2 align-middle">
        {isEditing ? (
            <input
              value={item.name}
              onChange={(e) => updateGradeItem(courseId, item.id, { name: e.target.value })}
              placeholder="Name"
              className="w-full min-w-[8rem] border-[3px] border-foreground bg-background px-2 py-1.5 text-sm font-bold text-foreground outline-none focus:border-primary focus:shadow-[4px_4px_0_0_var(--primary)]"
            />
          ) : (
            <span className={item.name ? "text-foreground font-bold" : "text-muted-foreground italic font-bold"}>
            {item.name || "Unnamed item"}
          </span>
        )}
      </td>
      <td className="py-4 px-2 align-middle">
        {isEditing ? (
            <input
              type="number"
              min={0}
              max={100}
              step={0.01}
              value={item.score === null ? "" : item.score}
              onChange={(e) => {
                const v = e.target.value;
                updateGradeItem(courseId, item.id, {
                  score: v === "" ? null : Number(v),
                });
              }}
              placeholder="%"
              className="w-full max-w-[6rem] border-[3px] border-foreground bg-background px-2 py-1.5 text-sm font-bold tabular-nums text-foreground outline-none focus:border-primary focus:shadow-[4px_4px_0_0_var(--primary)]"
            />
          ) : (
            <span className="tabular-nums text-foreground font-bold">
            {item.score !== null ? `${item.score.toFixed(2)}%` : "—"}
          </span>
        )}
      </td>
      <td className="py-4 px-2 align-middle">
        {isEditing ? (
            <input
              type="number"
              min={0}
              max={100}
              step={0.01}
              value={item.weight}
              onChange={(e) =>
                updateGradeItem(courseId, item.id, { weight: Number(e.target.value) })
              }
              placeholder="Weight"
              className="w-full max-w-[6rem] border-[3px] border-foreground bg-background px-2 py-1.5 text-sm font-bold tabular-nums text-foreground outline-none focus:border-primary focus:shadow-[4px_4px_0_0_var(--primary)]"
            />
          ) : (
            <span className="tabular-nums text-foreground font-bold">{item.weight.toFixed(2)}%</span>
          )}
      </td>
      <td className="py-4 pl-2 pr-4 align-middle text-right">
        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="border-[3px] border-transparent p-2 text-foreground transition-all hover:-translate-y-1 hover:-translate-x-1 hover:border-foreground hover:bg-accent hover:shadow-[4px_4px_0_0_var(--foreground)]"
            title={isEditing ? "Save changes" : "Edit item"}
          >
            {isEditing ? <Check className="h-4 w-4 text-foreground font-black" /> : <Pencil className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => removeGradeItem(courseId, item.id)}
            className="border-[3px] border-transparent p-2 text-foreground transition-all hover:-translate-y-1 hover:-translate-x-1 hover:border-foreground hover:bg-destructive hover:text-destructive-foreground hover:shadow-[4px_4px_0_0_var(--foreground)]"
            title="Remove item"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
