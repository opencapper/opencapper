import { ApiError } from "@/server/errors";
import { serverEnv } from "@/server/env";
import { createHash, timingSafeEqual } from "node:crypto";

const digest = (value: string) => createHash("sha256").update(value).digest();

export function isBotToken(header: string | undefined): boolean {
  const expected = serverEnv.botApiToken;
  if (!expected || !header) return false;
  const token = header.replace(/^Bearer\s+/i, "");
  return timingSafeEqual(digest(token), digest(expected));
}

export function assertBotToken(header: string | undefined) {
  if (!serverEnv.botApiToken)
    throw new ApiError(500, "ERRORS.API_TOKEN_MISSING");
  if (!isBotToken(header)) throw new ApiError(401, "ERRORS.UNAUTHORIZED");
}
