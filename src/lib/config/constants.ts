import {
  BR,
  DE,
  ES,
  FR,
  IT,
  JP,
  NL,
  PL,
  TR,
  US,
} from "country-flag-icons/react/3x2";
import type { Locale } from "next-intl";
import type { FunctionComponent, SVGAttributes } from "react";
import type { TranslationKey } from "@/lib/types";
import { env } from "./env";

export const LOCALES = [
  "en",
  "de",
  "es",
  "pt-BR",
  "fr",
  "it",
  "pl",
  "tr",
  "nl",
  "ja",
] as const;

type DashToUnderscore<T extends string> = T extends `${infer A}-${infer B}`
  ? `${A}_${DashToUnderscore<B>}`
  : T;

type LocaleCode = Uppercase<DashToUnderscore<(typeof LOCALES)[number]>>;

export const LANGUAGES: {
  code: LocaleCode;
  locale: Locale;
  Flag: FunctionComponent<SVGAttributes<SVGElement>>;
}[] = [
  { code: "EN", locale: "en", Flag: US },
  { code: "DE", locale: "de", Flag: DE },
  { code: "ES", locale: "es", Flag: ES },
  { code: "PT_BR", locale: "pt-BR", Flag: BR },
  { code: "FR", locale: "fr", Flag: FR },
  { code: "IT", locale: "it", Flag: IT },
  { code: "PL", locale: "pl", Flag: PL },
  { code: "TR", locale: "tr", Flag: TR },
  { code: "NL", locale: "nl", Flag: NL },
  { code: "JA", locale: "ja", Flag: JP },
];

// Marks a string as a translation key outside React, checked by tsc.
export const msg = <T extends TranslationKey>(key: T): T => key;

export const APP_VALUES = {
  appName: env.appName,
};

export const USER_THEME_COOKIE = "user-theme" as const;
export const DATA_TABLES_COOKIE = "data-tables" as const;
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export const CLAIM_ISSUE_URL =
  "https://github.com/opencapper/opencapper/issues/new";
