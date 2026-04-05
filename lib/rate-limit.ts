const MAX_REQUESTS_PER_WINDOW = 2;
const rateLimitMap = new Map<string, number[]>();

export function checkRateLimit(identifier: string, limitMs: number): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(identifier);
  
  if (!timestamps) return true;
  
  // Keep only timestamps within the current window
  const recent = timestamps.filter((t) => now - t < limitMs);
  return recent.length < MAX_REQUESTS_PER_WINDOW;
}

export function consumeRateLimit(identifier: string, limitMs: number): void {
  const now = Date.now();
  const timestamps = rateLimitMap.get(identifier) ?? [];
  
  // Keep only timestamps within the current window, then add the new one
  const recent = timestamps.filter((t) => now - t < limitMs);
  recent.push(now);
  rateLimitMap.set(identifier, recent);
  
  // Cleanup old entries periodically
  if (rateLimitMap.size > 1000) {
    for (const [key, ts] of rateLimitMap.entries()) {
      const valid = ts.filter((t) => now - t < limitMs);
      if (valid.length === 0) {
        rateLimitMap.delete(key);
      } else {
        rateLimitMap.set(key, valid);
      }
    }
  }
}
