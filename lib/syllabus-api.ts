import type { GradeItemKind } from "./types";

/** Parsed row from the LLM (before client applies to store). */
export type SyllabusParseItem = {
  name: string;
  kind: GradeItemKind;
  weightPercent: number;
};

export type SyllabusParseResponse = {
  items: SyllabusParseItem[];
  warnings?: string[];
};
