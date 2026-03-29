const rateLimitMap = new Map<string, number>();

export function checkRateLimit(ip: string, limitMs: number): boolean {
  const now = Date.now();
  const lastRequest = rateLimitMap.get(ip);
  
  if (lastRequest && now - lastRequest < limitMs) {
    return false; // Rate limit exceeded
  }
  
  rateLimitMap.set(ip, now);
  
  // Cleanup old entries periodically
  if (rateLimitMap.size > 1000) {
    for (const [key, timestamp] of rateLimitMap.entries()) {
      if (now - timestamp >= limitMs) {
        rateLimitMap.delete(key);
      }
    }
  }
  
  return true;
}
