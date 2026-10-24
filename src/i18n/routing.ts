import { LOCALES } from "@/lib/config/constants";
import { defineRouting } from "next-intl/routing";
import { ComponentProps } from "react";
import type { Link, useRouter } from "./navigation";

export type LinkHref = ComponentProps<typeof Link>["href"];
export type RouterPush = Parameters<ReturnType<typeof useRouter>["push"]>[0];

export const pathnames = {
  "/": "/",
  "/leaderboard": {
    en: "/leaderboard",
    de: "/rangliste",
    es: "/clasificacion",
    "pt-BR": "/classificacao",
    fr: "/classement",
    it: "/classifica",
    pl: "/ranking",
    tr: "/siralama",
    nl: "/ranglijst",
    ja: "/rankingu",
  },
  "/u/[username]": "/u/[username]",
  "/picks/new": {
    en: "/picks/new",
    de: "/tipps/neu",
    es: "/pronosticos/nuevo",
    "pt-BR": "/palpites/novo",
    fr: "/pronostics/nouveau",
    it: "/pronostici/nuovo",
    pl: "/typy/nowy",
    tr: "/tahminler/yeni",
    nl: "/tips/nieuw",
    ja: "/yoso/shinki",
  },
  "/verify": {
    en: "/verify",
    de: "/verifizieren",
    es: "/verificar",
    "pt-BR": "/verificar",
    fr: "/verifier",
    it: "/verifica",
    pl: "/weryfikacja",
    tr: "/dogrula",
    nl: "/verifieren",
    ja: "/kensho",
  },
  "/settings/appearance": {
    en: "/settings/appearance",
    de: "/einstellungen/darstellung",
    es: "/ajustes/apariencia",
    "pt-BR": "/configuracoes/aparencia",
    fr: "/parametres/apparence",
    it: "/impostazioni/aspetto",
    pl: "/ustawienia/wyglad",
    tr: "/ayarlar/gorunum",
    nl: "/instellingen/weergave",
    ja: "/settei/gaikan",
  },
  "/admin": "/admin",
} as const;

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: LOCALES[0],
  localePrefix: "always",
  localeDetection: true,
  // A Set-Cookie on anonymous pages makes them uncacheable at the edge.
  localeCookie: false,
  pathnames,
});
