import {
  formatError,
  type ErrorCode,
  type ErrorParams,
} from "@/lib/utils/api-error";
import { createTranslator } from "next-intl";
import en from "../../public/i18n/en.json";

// Synchronous so Elysia's 404 and validation paths need no request scope.
const english = createTranslator({ locale: "en", messages: en });

// Not `code`: Elysia reads `error.code` as its own error kind and the ApiError branch never runs.
export class ApiError extends Error {
  readonly status: number;
  readonly key: ErrorCode;
  readonly params?: ErrorParams;

  constructor(status: number, code: ErrorCode, params?: ErrorParams) {
    super(code);
    this.status = status;
    this.key = code;
    this.params = params;
  }
}

export function englishError(code: ErrorCode, params?: ErrorParams): string {
  return formatError(english, code, params);
}

// `error` stays English: the Discord and Telegram bots show it to users verbatim.
export function errorBody(
  code: ErrorCode,
  params?: ErrorParams,
): { error: string; code: ErrorCode; params?: ErrorParams } {
  const error = englishError(code, params);
  return params ? { error, code, params } : { error, code };
}
