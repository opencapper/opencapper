import { Providers } from "@/components/provider/providers";
import { Toaster } from "@/components/ui/sonner";
import { APP_VALUES } from "@/lib/config/constants";
import { env } from "@/lib/config/env";
import { buildThemeCss, googleFontHref } from "@/lib/theme/build-css";
import { allFontVariablesClass } from "@/lib/theme/fonts";
import { migrateTheme } from "@/lib/theme/migrate";
import { INITIAL_USER_THEME, USER_THEME_KEY } from "@/lib/theme/theme-types";
import { getCookieValue, serverLocale } from "@/lib/utils/server";
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { ReactNode } from "react";
import "../globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const locale = await serverLocale(props);
  const t = await getTranslations({ locale });
  return {
    metadataBase: new URL(env.appUrl),
    title: t("METADATA.TITLE", APP_VALUES),
    description: t("METADATA.DESCRIPTION"),
  };
}

const DEFAULT_THEME_CSS = buildThemeCss(INITIAL_USER_THEME);

export default async function LocaleLayout(props: Props) {
  const locale = await serverLocale(props);
  setRequestLocale(locale);
  const rawTheme = await getCookieValue<unknown>(USER_THEME_KEY);
  const userTheme = rawTheme === undefined ? undefined : migrateTheme(rawTheme);
  const themeCss = userTheme ? buildThemeCss(userTheme) : DEFAULT_THEME_CSS;
  const fontHref = userTheme ? googleFontHref(userTheme) : null;
  // Legal pages render on the server only; their long texts stay out of every page's client payload.
  const clientMessages = Object.fromEntries(
    Object.entries(await getMessages()).filter((entry) => entry[0] !== "LEGAL"),
  );

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* A second head-level next-themes provider emits this script twice:
            next-themes does not dedupe across React trees. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("theme");var d=!t||t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);var c=document.documentElement.classList;c.toggle("dark",d);c.toggle("light",!d)}catch(e){}`,
          }}
        />
        {/* Plain style, no href/precedence: React's float cache discards the
            textContent UserThemeProvider mutates for live edits. */}
        <style id="user-theme" dangerouslySetInnerHTML={{ __html: themeCss }} />
        {fontHref && (
          <link id="user-theme-font" rel="stylesheet" href={fontHref} />
        )}
      </head>
      <body
        className={`${allFontVariablesClass} flex min-h-dvh flex-col font-sans antialiased`}
      >
        <NextIntlClientProvider messages={clientMessages}>
          <Providers userTheme={userTheme}>
            <Toaster richColors />
            {props.children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
