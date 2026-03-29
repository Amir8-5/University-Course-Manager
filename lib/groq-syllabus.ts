import Groq from "groq-sdk";
import { GROQ_SYLLABUS_SYSTEM_PROMPT } from "./syllabus-prompt";
import type { SyllabusParseItem } from "./syllabus-api";
import { parseCourseworkJson } from "./syllabus-normalize";

/** Max characters of syllabus text sent to Groq; excess is dropped from the end (last pages). */
const MAX_SYLLABUS_CHARS = 17_500;

const GROQ_JSON_INSTRUCTION = `You must respond with a single JSON object only (no markdown code fences), with exactly this shape:
{"coursework":[{"name":"string","category":"assignment"|"test"|"other","weight":number}]}
Use "weight" as the percentage of the final grade (0-100).`;

export async function extractCourseworkWithGroq(markdown: string): Promise<SyllabusParseItem[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const model = process.env.GROQ_MODEL ?? "llama-3.1-8b-instant";

  const truncationNote = "\n\n[Truncated: later pages removed.]";
  const body =
    markdown.length > MAX_SYLLABUS_CHARS
      ? markdown.slice(0, MAX_SYLLABUS_CHARS - truncationNote.length) + truncationNote
      : markdown;

  const groq = new Groq({ apiKey });
  const completion = await groq.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: `${GROQ_SYLLABUS_SYSTEM_PROMPT}\n\n${GROQ_JSON_INSTRUCTION}`,
      },
      {
        role: "user",
        content: `Extract graded coursework from the following syllabus (markdown or plain text).\n\n${body}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content?.trim()) {
    throw new Error("Empty response from Groq");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content) as unknown;
  } catch {
    throw new Error("Groq returned invalid JSON");
  }

  return parseCourseworkJson(parsed);
}
