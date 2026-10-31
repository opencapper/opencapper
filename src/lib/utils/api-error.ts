import type { TranslationKey } from "@/lib/types";
import { isRecord, rec } from "@/lib/utils/base";
import type { useTranslations } from "next-intl";

export type ErrorCode = Extract<TranslationKey, `ERRORS.${string}`>;
export type ErrorParams = Record<string, string | number>;

export type ApiErrorDetail = {
  code?: ErrorCode;
  params?: ErrorParams;
  message?: string;
};

export class CodedError extends Error {
  readonly code: ErrorCode;
  readonly params?: ErrorParams;

  constructor(code: ErrorCode, params?: ErrorParams) {
    super(code);
    this.name = "CodedError";
    this.code = code;
    this.params = params;
  }
}

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === "string" && value.startsWith("ERRORS.");
}

function readParams(value: unknown): ErrorParams | undefined {
  if (!isRecord(value)) return undefined;
  const params: ErrorParams = {};
  for (const [key, param] of Object.entries(value)) {
    if (typeof param === "string" || typeof param === "number")
      params[key] = param;
  }
  return params;
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

// Eden puts the JSON body on `value`; Better Auth returns `{ code, message, status }` itself.
export function readApiError(error: unknown): ApiErrorDetail {
  if (error instanceof CodedError)
    return { code: error.code, params: error.params };
  const outer = rec(error);
  const body = rec(outer?.value) ?? outer;
  const message = text(body?.error) ?? text(body?.message);
  if (isErrorCode(body?.code))
    return { code: body.code, params: readParams(body.params), message };
  if (outer?.status === 429) return { code: "ERRORS.RATE_LIMITED", message };
  if (error instanceof Error && isErrorCode(error.message))
    return { code: error.message };
  return { message };
}

type Translator = ReturnType<typeof useTranslations<never>>;

// One case per ICU argument set: a new parameterised code fails tsc in `default`.
export function formatError(
  t: Translator,
  code: ErrorCode,
  params: ErrorParams = {},
): string {
  const param = (name: string) => String(params[name] ?? "");
  switch (code) {
    case "ERRORS.INVALID_REQUEST":
      return t(code, { path: param("path") });
    case "ERRORS.TEAM_NOT_IN_EVENT":
    case "ERRORS.OUTCOME_NOT_IN_EVENT":
      return t(code, { home: param("home"), away: param("away") });
    case "ERRORS.UNITS_INVALID":
      return t(code, {
        min: param("min"),
        max: param("max"),
        step: param("step"),
      });
    case "ERRORS.LINE_NOT_OFFERED":
      return t(code, { line: param("line") });
    default:
      return t(code);
  }
}

// A known code is translated; a generic server failure keeps the screen's own wording.
export function apiErrorText(
  t: Translator,
  error: unknown,
  fallback: string,
): string {
  const detail = readApiError(error);
  if (detail.code === "ERRORS.INTERNAL") return fallback;
  if (detail.code && t.has(detail.code))
    return formatError(t, detail.code, detail.params);
  return detail.message ?? fallback;
}
