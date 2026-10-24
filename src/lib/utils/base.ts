import { msg } from "@/lib/config/constants";

export function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

export function rec(v: unknown): Record<string, unknown> | undefined {
  return isRecord(v) ? v : undefined;
}

// Eden resolves errors instead of throwing; React Query needs the throw.
export function handleElysia<T>(response: {
  data: T | null;
  error: unknown;
}): T {
  if (response.error) throw response.error;
  if (response.data === null) throw new Error(msg("ERRORS.EMPTY_RESPONSE"));
  return response.data;
}
