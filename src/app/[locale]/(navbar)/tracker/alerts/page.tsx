import { SignInPrompt } from "@/components/elements/account/sign-in-prompt";
import { AlertsInbox } from "@/components/pages/navbar/tracker/alerts-inbox";
import { TrackerShell } from "@/components/pages/navbar/tracker/tracker";
import { api, load } from "@/lib/api/client";
import { authHeaders, getAccount } from "@/lib/auth/session";
import { planOf } from "@/lib/format";
import { serverLocale } from "@/lib/utils/server";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { connection } from "next/server";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: await serverLocale(props), namespace: "TRACKER" });
  return { title: t("TAB_ALERTS") };
}

export default async function AlertsInboxPage(props: Props) {
  setRequestLocale(await serverLocale(props));
  await connection();
  const account = await getAccount();
  const headers = await authHeaders();
  if (!account || !headers) {
    return (
      <TrackerShell active="/tracker/alerts">
        <SignInPrompt next="/tracker/alerts" />
      </TrackerShell>
    );
  }
  const results = await Promise.all([
    load(api.GET("/v1/me/alerts/history", { headers, params: { query: { limit: 200 } }, cache: "no-store" })),
    load(api.GET("/v1/me/alerts", { headers, cache: "no-store" })),
    load(api.GET("/v1/books", { cache: "no-store" })),
  ]);
  return (
    <AlertsInbox
      alerts={results[0]}
      enabled={results[1]?.enabled ?? false}
      fees={results[2] ?? []}
      plan={planOf(account.settings)}
    />
  );
}
