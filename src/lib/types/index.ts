import type { Messages, useTranslations } from "next-intl";

export type TranslationKey = Parameters<
  ReturnType<typeof useTranslations<never>>
>[0];

type PlainLeaves<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? T[K] extends `${string}{${string}`
      ? never
      : `${P}${K}`
    : PlainLeaves<T[K], `${P}${K}.`>;
}[keyof T & string];

// Keys whose message takes no ICU argument, so `t(key)` accepts the union.
export type PlainTranslationKey = Extract<
  TranslationKey,
  PlainLeaves<Messages>
>;
