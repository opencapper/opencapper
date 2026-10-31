import { createRateLimiter } from "@/server/rate-limit";

const perMinute = createRateLimiter({ limit: 10, windowMs: 60_000 });
const perHour = createRateLimiter({ limit: 60, windowMs: 60 * 60_000 });

// Keyed per picker, not per caller: the bot token speaks for every Discord and Telegram user.
export function throttlePicks(key: string) {
  perMinute(key);
  perHour(key);
}
