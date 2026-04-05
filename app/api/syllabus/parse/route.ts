import mime from "mime";
import { NextResponse } from "next/server";
import { extractCourseworkWithGroq } from "@/lib/groq-syllabus";
import { parseDocumentToMarkdown } from "@/lib/llamaparse";
import { buildWarnings } from "@/lib/syllabus-validate";
import { checkRateLimit, consumeRateLimit } from "@/lib/rate-limit";
import { isCompressed, decompressStream } from "@/lib/compression";
import { PDFParse } from "pdf-parse";

// Configuration constants
const MAX_ATTEMPTS = 2;
const LLM_TIMEOUT_MS = 15000; // 15 seconds for LlamaParse (PDF or other docs)
const GROQ_TIMEOUT_MS = 15000; // 15 seconds for Groq extraction

/** Helper to enforce timeout on a promise */
function withTimeout<T>(promise: Promise<T>, ms: number, name: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${name} timed out after ${ms}ms`));
    }, ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export const maxDuration = 100;

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

const MAX_FILE_BYTES = 5 * 1024 * 1024;

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

  if (fileField instanceof File && fileField.size > 0) {
    if (!process.env.LLAMA_CLOUD_API_KEY) {
      return NextResponse.json(
        { error: "Server is not configured with LLAMA_CLOUD_API_KEY for file uploads." },
        { status: 503 },
      );
    }
    if (fileField.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "File is too large (max 5 MB)." },
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

    // Turn it into buffer for pdf-parse
    const buf = new Uint8Array(await fileField.arrayBuffer());
    try {
      if (mimeType === "application/pdf") {
        const parser = new PDFParse({ data: buf });
        const data = await parser.getText();
        markdown = data.text;
      } else {
        markdown = await parseDocumentToMarkdown(buf, fileField.name || "document", mimeType);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Parse failed. Non specified error";
      console.error(msg);
      return NextResponse.json({ error: "Parsing Failed" }, { status: 502 });
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

  try {
    let items: any = [];
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        items = await extractCourseworkWithGroq(markdown);
        break; // success
      } catch (e) {
        if (attempt + 1 >= MAX_ATTEMPTS) {
          throw e;
        }
        // exponential backoff
        const delay = 500 * Math.pow(2, attempt);
        await new Promise((res) => setTimeout(res, delay));
      }
    }

    const warnings = buildWarnings(items);
    return NextResponse.json({
      items,
      warnings: warnings.length > 0 ? warnings : undefined,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to extract coursework.";
    console.error(msg);
    return NextResponse.json({ error: "Failed to extract coursework."}, { status: 502 });
  }
}
