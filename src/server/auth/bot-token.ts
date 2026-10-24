import { ApiError } from "@/server/errors";
import { serverEnv } from "@/server/env";
import { createHash, timingSafeEqual } from "node:crypto";

const digest = (value: string) => createHash("sha256").update(value).digest();

export function assertBotToken(header: string | undefined) {
  const expected = serverEnv.botApiToken;
  if (!expected) throw new ApiError(500, "ERRORS.API_TOKEN_MISSING");
  const token = header?.replace(/^Bearer\s+/i, "") ?? "";
  if (!timingSafeEqual(digest(token), digest(expected)))
    throw new ApiError(401, "ERRORS.UNAUTHORIZED");
}
