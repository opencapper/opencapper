import { ApiError } from "@/server/errors";

const MAX_KEYS = 10_000;

// Fixed window per key, in process: one app container, so no shared store is needed.
export function createRateLimiter(options: {
  limit: number;
  windowMs: number;
}) {
  const windows = new Map<string, { start: number; count: number }>();

  return (key: string) => {
    const now = Date.now();
    const current = windows.get(key);
    if (!current || now - current.start >= options.windowMs) {
      if (windows.size >= MAX_KEYS) {
        for (const entry of windows) {
          if (now - entry[1].start >= options.windowMs)
            windows.delete(entry[0]);
        }
        if (windows.size >= MAX_KEYS) windows.clear();
      }
      windows.set(key, { start: now, count: 1 });
      return;
    }
    current.count += 1;
    if (current.count > options.limit)
      throw new ApiError(429, "ERRORS.RATE_LIMITED");
  };
}

// Cloudflare sets the first, Traefik the second; the app is never reached directly.
export function clientIp(headers: Record<string, string | undefined>): string {
  return (
    headers["cf-connecting-ip"]?.trim() ||
    headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    "unknown"
  );
}
