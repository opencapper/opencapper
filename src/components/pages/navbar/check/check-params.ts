import { CHECK_QUERY_MAX } from "@/lib/api/typebox/check";
import { createLoader, parseAsString } from "nuqs/server";

// Shared by the client hook and the server prefetch, so both build the same query key.
export const CHECK_PARSERS = {
  q: parseAsString.withDefault(""),
};

export const loadCheckParams = createLoader(CHECK_PARSERS);

export function checkTerm(q: string): string {
  return q.trim().slice(0, CHECK_QUERY_MAX);
}
