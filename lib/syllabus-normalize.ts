import type { SyllabusParseItem } from "./syllabus-api";
import type { GradeItemKind } from "./types";

export function normalizeCategory(raw: string): GradeItemKind {
  const x = raw.toLowerCase().trim();
  if (x === "test") return "test";
  if (x === "other") return "other";
  return "assignment";
}

export function courseworkRowsToItems(rows: unknown[]): SyllabusParseItem[] {
  const items: SyllabusParseItem[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const name = typeof r.name === "string" ? r.name.trim() : "";
    if (!name) continue;
    const kind = normalizeCategory(typeof r.category === "string" ? r.category : "assignment");
    let w = Number(r.weight);
    if (!Number.isFinite(w)) w = 0;
    w = Math.min(100, Math.max(0, w));
    items.push({ name, kind, weightPercent: w });
  }
  return items;
}

export function parseCourseworkJson(parsed: unknown): SyllabusParseItem[] {
  if (!parsed || typeof parsed !== "object" || !("coursework" in parsed)) {
    throw new Error("Expected JSON with a coursework array");
  }
  const coursework = (parsed as { coursework: unknown }).coursework;
  if (!Array.isArray(coursework)) {
    throw new Error("coursework must be an array");
  }
  return courseworkRowsToItems(coursework);
}
