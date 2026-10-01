import Groq from "groq-sdk";
import { GROQ_SYLLABUS_SYSTEM_PROMPT } from "./syllabus-prompt";
import type { SyllabusParseItem } from "./syllabus-api";
import { parseCourseworkJson } from "./syllabus-normalize";

/** Max characters of syllabus text sent to Groq; excess is dropped from the end (last pages). */
const MAX_SYLLABUS_CHARS = 17_500;

export const DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b";

/** Models known to be decommissioned or unsupported on Groq */
const OBSOLETE_GROQ_MODELS = new Set([
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "llama-3.1-70b-versatile",
]);

function getGroqModel(): string {
  const configured = process.env.GROQ_MODEL?.trim();
  if (!configured || OBSOLETE_GROQ_MODELS.has(configured)) {
    return DEFAULT_GROQ_MODEL;
  }
  return configured;
}

const GROQ_JSON_INSTRUCTION = `You must respond with a single JSON object only (no markdown code fences), with exactly this shape:
{"coursework":[{"name":"string","category":"assignment"|"test"|"other","weight":number}]}
Use "weight" as the percentage of the final grade (0-100), formatted to two decimal places (e.g., 5.25).`;

export async function extractCourseworkWithGroq(markdown: string): Promise<SyllabusParseItem[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  let model = getGroqModel();

  const truncationNote = "\n\n[Truncated: later pages removed.]";
  const body =
    markdown.length > MAX_SYLLABUS_CHARS
      ? markdown.slice(0, MAX_SYLLABUS_CHARS - truncationNote.length) + truncationNote
      : markdown;

  const groq = new Groq({ apiKey });

  const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `${GROQ_SYLLABUS_SYSTEM_PROMPT}\n\n${GROQ_JSON_INSTRUCTION}`,
    },
    {
      role: "user",
      content: `Extract graded coursework from the following syllabus (markdown or plain text).\n\n${body}`,
    },
  ];

  let completion;
  try {
    completion = await groq.chat.completions.create({
      model,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.2,
    });
  } catch (err: unknown) {
    // If the configured model is not found or inaccessible, fallback to the default model
    const isModelNotFound =
      err &&
      typeof err === "object" &&
      (("code" in err && (err as { code: unknown }).code === "model_not_found") ||
        ("status" in err && (err as { status: unknown }).status === 404));

    if (isModelNotFound && model !== DEFAULT_GROQ_MODEL) {
      console.warn(`Model ${model} not available on Groq, falling back to ${DEFAULT_GROQ_MODEL}`);
      model = DEFAULT_GROQ_MODEL;
      completion = await groq.chat.completions.create({
        model,
        messages,
        response_format: { type: "json_object" },
        temperature: 0.2,
      });
    } else {
      throw err;
    }
  }

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
