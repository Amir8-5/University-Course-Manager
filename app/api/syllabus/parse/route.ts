import mime from "mime";
import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { extractCourseworkWithGroq } from "@/lib/groq-syllabus";
import { parseDocumentToMarkdown } from "@/lib/llamaparse";
import { buildWarnings } from "@/lib/syllabus-validate";
import { checkRateLimit, consumeRateLimit } from "@/lib/rate-limit";
import { isCompressed, decompressStream } from "@/lib/compression";

export const maxDuration = 180;

/** Common syllabus uploads supported by LlamaParse (extension-based). */
const ALLOWED_EXT = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".txt",
  ".ppt",
  ".pptx",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".html",
  ".htm",
]);

const MAX_FILE_BYTES = 15 * 1024 * 1024;

function getExtension(filename: string): string {
  const i = filename.lastIndexOf(".");
  return i >= 0 ? filename.slice(i).toLowerCase() : "";
}

function resolveMime(file: File): string {
  if (file.type && file.type !== "application/octet-stream") {
    return file.type;
  }
  const fromName = file.name ? mime.getType(file.name) : null;
  return fromName ?? "application/octet-stream";
}

async function logMetrics(llamaTimeMs: number | null, groqTimeMs: number, success: boolean) {
  try {
    const logPath = path.join(process.cwd(), "parse-metrics.log");
    const timestamp = new Date().toISOString();
    const llamaStr = llamaTimeMs !== null ? `${llamaTimeMs.toFixed(0)}ms` : "N/A (Text)";
    const groqStr = `${groqTimeMs.toFixed(0)}ms`;
    const line = `[${timestamp}] LlamaParse: ${llamaStr} | Groq: ${groqStr} | Success: ${success}\n`;
    await fs.appendFile(logPath, line, "utf-8");
  } catch (e) {
    console.error("Failed to write metrics", e);
  }
}

export async function POST(request: Request) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "Server is not configured with GROQ_API_KEY." },
      { status: 503 },
    );
  }

  const adminTokenHeader = request.headers.get("x-admin-token");
  const serverAdminToken = process.env.ADMIN_TOKEN;
  const isAdmin = serverAdminToken && adminTokenHeader === serverAdminToken;

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  if (!isAdmin && ip !== "unknown" && !checkRateLimit(ip, ONE_DAY_MS)) {
    return NextResponse.json(
      { error: "Daily limit reached. You can only perform one syllabus parse per day." },
      { status: 429 },
    );
  }

  let currentRequest = request;
  if (isCompressed(request) && request.body) {
    try {
      // Read all compressed data into memory first
      const buf = await request.arrayBuffer();
      
      // Decompress fully before parsing form data to avoid streaming hangups in Node.js
      const compressedStream = new Blob([buf]).stream();
      const decompressedStream = decompressStream(compressedStream);
      const decompressedResponse = new Response(decompressedStream);
      const decompressedBuffer = await decompressedResponse.arrayBuffer();
      
      currentRequest = new Request(request.url, {
        method: request.method,
        headers: request.headers,
        body: decompressedBuffer,
      });
    } catch (e) {
      console.error("Decompression failed:", e);
      return NextResponse.json({ error: "Failed to decompress body." }, { status: 400 });
    }
  }

  let form: FormData;
  try {
    form = await currentRequest.formData();
  } catch (e) {
    console.error("Form parse failed:", e);
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const textField = form.get("text");
  const fileField = form.get("file");

  let markdown: string;
  let llamaTimeMs: number | null = null;

  if (fileField instanceof File && fileField.size > 0) {
    if (!process.env.LLAMA_CLOUD_API_KEY) {
      return NextResponse.json(
        { error: "Server is not configured with LLAMA_CLOUD_API_KEY for file uploads." },
        { status: 503 },
      );
    }
    if (fileField.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "File is too large (max 15 MB)." },
        { status: 400 },
      );
    }
    const ext = getExtension(fileField.name);
    if (!ext || !ALLOWED_EXT.has(ext)) {
      return NextResponse.json(
        {
          error: `Unsupported file type (${ext || "no extension"}). Use PDF, Word, PowerPoint, text, HTML, or common images.`,
        },
        { status: 400 },
      );
    }
    const mimeType = resolveMime(fileField);
    const buf = Buffer.from(await fileField.arrayBuffer());
    let startLlama = 0;
    try {
      startLlama = performance.now();
      markdown = await parseDocumentToMarkdown(buf, fileField.name || "document", mimeType);
      llamaTimeMs = performance.now() - startLlama;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "LlamaParse failed.";
      return NextResponse.json({ error: msg }, { status: 502 });
    }
  } else if (typeof textField === "string" && textField.trim().length > 0) {
    markdown = textField.trim();
  } else {
    return NextResponse.json(
      {
        error: 'Upload a supported file or paste syllabus text in the "text" field.',
      },
      { status: 400 },
    );
  }

  if (!isAdmin && ip !== "unknown") {
    consumeRateLimit(ip, ONE_DAY_MS);
  }

  const startGroq = performance.now();
  try {
    const items = await extractCourseworkWithGroq(markdown);
    const groqTimeMs = performance.now() - startGroq;
    await logMetrics(llamaTimeMs, groqTimeMs, true);

    const warnings = buildWarnings(items);
    return NextResponse.json({
      items,
      warnings: warnings.length > 0 ? warnings : undefined,
    });
  } catch (e) {
    const groqTimeMs = performance.now() - startGroq;
    await logMetrics(llamaTimeMs, groqTimeMs, false);

    const msg = e instanceof Error ? e.message : "Failed to extract coursework.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
