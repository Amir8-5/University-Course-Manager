/**
 * Gzip compression utilities using native CompressionStream/DecompressionStream.
 * Supported in modern browsers (Chrome 103+, Safari 16+, Firefox 113+)
 * and Node.js 18+.
 */

export const MAX_COMPRESSED_SIZE = 4 * 1024 * 1024; // 4MB

/**
 * Compresses a ReadableStream using Gzip.
 */
export function compressStream(stream: ReadableStream): ReadableStream {
  return stream.pipeThrough(new CompressionStream("gzip"));
}

/**
 * Decompresses a ReadableStream using Gzip.
 */
export function decompressStream(stream: ReadableStream): ReadableStream {
  return stream.pipeThrough(new DecompressionStream("gzip"));
}

/**
 * Checks if a Request is gzipped based on headers.
 */
export function isCompressed(request: Request): boolean {
  return request.headers.get("content-encoding") === "gzip";
}

/**
 * Compresses a Blob/File/String into a Gzip Blob.
 */
export async function compressToBlob(data: Blob | string): Promise<Blob> {
  const stream = (typeof data === "string" ? new Blob([data]) : data).stream();
  const compressedStream = compressStream(stream);
  const response = new Response(compressedStream);
  return await response.blob();
}
