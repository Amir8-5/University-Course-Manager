import { MAX_COMPRESSED_SIZE, compressToBlob } from "./compression";

export type FetchOptions = RequestInit & {
  /** Skip compression even if payload is large */
  skipCompression?: boolean;
  /** Force compression even if payload is small */
  forceCompression?: boolean;
};

const COMPRESSION_THRESHOLD = 50 * 1024; // 50KB

/**
 * A fetch wrapper that automatically decompresses/compresses payloads
 * and performs size checks.
 */
export async function fetchWithCompression(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { skipCompression, forceCompression, ...init } = options;
  let body = init.body;
  let headers = new Headers(init.headers || {});

  // Only compress POST/PUT/PATCH with a body
  const method = (init.method || "GET").toUpperCase();
  const shouldCompress = 
    !skipCompression && 
    body && 
    ["POST", "PUT", "PATCH"].includes(method);

  if (shouldCompress) {
    let rawBlob: Blob | null = null;

    if (body instanceof FormData) {
      // Convert FormData to Blob (preserves multipart boundary)
      // Note: This is an async operation that requires a Response object
      const tempResponse = new Response(body);
      rawBlob = await tempResponse.blob();
      // Update Content-Type to match the boundary
      headers.set("content-type", tempResponse.headers.get("content-type") || "multipart/form-data");
    } else if (body instanceof URLSearchParams) {
      rawBlob = new Blob([body.toString()], { type: "application/x-www-form-urlencoded" });
    } else if (typeof body === "string") {
      rawBlob = new Blob([body], { type: headers.get("content-type") || "text/plain" });
    } else if (!(body instanceof Blob) && !(body instanceof ArrayBuffer) && body !== null) {
      // Likely a POJO
      rawBlob = new Blob([JSON.stringify(body)], { type: "application/json" });
      headers.set("content-type", "application/json");
    } else if (body instanceof Blob) {
      rawBlob = body;
    }

    if (rawBlob && (forceCompression || rawBlob.size > COMPRESSION_THRESHOLD)) {
      const compressedBlob = await compressToBlob(rawBlob);
      
      // Perform post-compression size check
      if (compressedBlob.size > MAX_COMPRESSED_SIZE) {
        const sizeMb = (compressedBlob.size / (1024 * 1024)).toFixed(2);
        const limitMb = (MAX_COMPRESSED_SIZE / (1024 * 1024)).toFixed(2);
        throw new Error(
          `Payload too large: Compressed size is ${sizeMb}MB, exceeding the limit of ${limitMb}MB.`
        );
      }
      
      console.log(`Original Size: ${(rawBlob.size / 1024).toFixed(2)}KB -> Compressed: ${(compressedBlob.size / 1024).toFixed(2)}KB`);

      body = compressedBlob;
      headers.set("content-encoding", "gzip");
      // Keep original content-type
    } else if (rawBlob) {
      // If we don't compress, use the exported Blob. This ensures the 
      // body strictly aligns with the newly set content-type boundary headers.
      body = rawBlob;
    }
  }

  return fetch(url, {
    ...init,
    headers,
    body,
  });
}
