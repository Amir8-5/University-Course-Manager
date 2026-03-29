import LlamaCloud, { toFile } from "@llamaindex/llama-cloud";

/**
 * Upload a document to LlamaCloud / LlamaParse and return full markdown (or plain text).
 */
export async function parseDocumentToMarkdown(
  buffer: Buffer,
  filename: string,
  mimeType: string,
): Promise<string> {
  const apiKey = process.env.LLAMA_CLOUD_API_KEY;
  if (!apiKey) {
    throw new Error("LLAMA_CLOUD_API_KEY is not configured");
  }

  const client = new LlamaCloud({ apiKey });
  const upload_file = await toFile(buffer, filename, { type: mimeType });

  const result = await client.parsing.parse(
    {
      upload_file,
      tier: "agentic",
      version: "latest",
      output_options: {
        markdown: {
          tables: {
            output_tables_as_markdown: false,
          },
        },
      },
      expand: ["markdown_full", "text_full"],
    },
    {
      /** Seconds; stay under typical serverless route limits */
      timeout: 110,
    },
  );

  const md = result.markdown_full?.trim();
  if (md) return md;
  const text = result.text_full?.trim();
  if (text) return text;
  throw new Error("LlamaParse returned no markdown or text for this file");
}
