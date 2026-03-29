import type { SyllabusParseItem } from "./syllabus-api";

const SUM_WARN_THRESHOLD = 5;

export function buildWarnings(items: SyllabusParseItem[]): string[] {
  const warnings: string[] = [];
  const sum = items.reduce((s, i) => s + i.weightPercent, 0);
  if (items.length > 0 && Math.abs(sum - 100) > SUM_WARN_THRESHOLD) {
    warnings.push(
      `Weights sum to about ${sum.toFixed(1)}% (expected near 100%). Adjust rows after import if needed.`,
    );
  }
  if (items.length === 0) {
    warnings.push("No graded items were extracted. Try pasting a clearer grading section or a different file.");
  }
  return warnings;
}
