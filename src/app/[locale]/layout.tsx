import { Providers } from "@/components/provider/providers";
import { Toaster } from "@/components/ui/sonner";
import { APP_VALUES } from "@/lib/config/constants";
import { env } from "@/lib/config/env";
import { fontVariables } from "@/lib/config/fonts";
import { serverLocale } from "@/lib/utils/server";
import { ogMetadata } from "@/lib/og/metadata";
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ReactNode } from "react";
import "../globals.css";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0c" },
  ],
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
    title: {
      default: t("METADATA.TITLE", APP_VALUES),
      template: `%s | ${env.appName}`,
    },
    description: t("METADATA.DESCRIPTION"),
    robots: { index: false, follow: false },
    // The site ships its own dark theme; this tells Dark Reader not to invert it.
    other: { "darkreader-lock": "true" },
    ...ogMetadata("home", locale),
  };
}

export default async function LocaleLayout(props: Props) {
  const locale = await serverLocale(props);
  setRequestLocale(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${fontVariables} flex min-h-dvh flex-col font-sans antialiased`}
      >
        <NextIntlClientProvider>
          <Providers>
            <Toaster />
            {props.children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
