import { SignInPrompt } from "@/components/elements/account/sign-in-prompt";
import { CARD_LABEL, PageHeading } from "@/components/elements/page/page-heading";
import { PageShell } from "@/components/elements/page/page-shell";
import { AlertsForm } from "@/components/pages/navbar/settings/alerts-form";
import { SettingsForm } from "@/components/pages/navbar/settings/settings-form";
import { TelegramCard } from "@/components/pages/navbar/settings/telegram-card";
import { MyBooks } from "@/components/pages/navbar/value-bets/my-books";
import { ThemeSegments } from "@/components/toggle/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api, load } from "@/lib/api/client";
import { authHeaders, getAccount } from "@/lib/auth/session";
import { MY_BOOKS_COOKIE } from "@/lib/config/constants";
import { getCookieValue, serverLocale } from "@/lib/utils/server";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { connection } from "next/server";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: await serverLocale(props), namespace: "SETTINGS" });
  return { title: t("HEADING") };
}

export default async function SettingsPage(props: Props) {
  const locale = await serverLocale(props);
  setRequestLocale(locale);
  await connection();
  const t = await getTranslations({ locale, namespace: "SETTINGS" });
  const headers = await authHeaders();
  const results = await Promise.all([
    getAccount(),
    load(api.GET("/v1/books", { cache: "no-store" })),
    headers ? load(api.GET("/v1/me/alerts", { headers, cache: "no-store" })) : undefined,
    getCookieValue<unknown>(MY_BOOKS_COOKIE),
  ]);
  const account = results[0];
  const books = (results[1] ?? []).map((b) => b.book).filter((b) => b !== "pinnacle");
  const alerts = results[2];
  const cookieBooks = Array.isArray(results[3]) ? results[3].filter((b) => typeof b === "string") : [];

  const appearance = (
    <Card>
      <CardHeader>
        <CardTitle className={CARD_LABEL}>{t("APPEARANCE_TITLE")}</CardTitle>
        <CardDescription>{t("APPEARANCE_HINT")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ThemeSegments />
      </CardContent>
    </Card>
  );

  return (
    <PageShell className="max-w-3xl">
      <PageHeading
        className="mb-0"
        label={t("LABEL")}
        title={t("HEADING")}
        description={account ? t("SUBHEADING", { name: account.user.display_name }) : t("SUBHEADING_OUT")}
      />
      {appearance}
      {account ? (
        <>
          <SettingsForm settings={account.settings} books={books} />
          {alerts && (
            <AlertsForm
              prefs={alerts}
              books={books}
              preferred={account.settings.preferred_books}
              telegramLinked={account.user.telegram_linked}
            />
          )}
          <TelegramCard linked={account.user.telegram_linked} username={account.user.telegram_username} />
        </>
      ) : (
        <>
          <MyBooks mode="settings" books={books} selected={cookieBooks} />
          <SignInPrompt next="/settings" />
        </>
      )}
    </PageShell>
  );
}
