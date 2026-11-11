export function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

export function rec(v: unknown): Record<string, unknown> | undefined {
  return isRecord(v) ? v : undefined;
}
