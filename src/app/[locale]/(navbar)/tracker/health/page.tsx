import { SignInPrompt } from "@/components/elements/account/sign-in-prompt";
import { Health } from "@/components/pages/navbar/tracker/health";
import { TrackerShell } from "@/components/pages/navbar/tracker/tracker";
import { api, load } from "@/lib/api/client";
import { authHeaders, getAccount } from "@/lib/auth/session";
import { serverLocale } from "@/lib/utils/server";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { connection } from "next/server";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: await serverLocale(props), namespace: "TRACKER" });
  return { title: t("TAB_HEALTH") };
}

export default async function HealthPage(props: Props) {
  setRequestLocale(await serverLocale(props));
  await connection();
  const account = await getAccount();
  const headers = await authHeaders();
  if (!account || !headers) {
    return (
      <TrackerShell active="/tracker/health">
        <SignInPrompt next="/tracker/health" />
      </TrackerShell>
    );
  }
  const books = await load(api.GET("/v1/bets/books-health", { headers, cache: "no-store" }));
  return <Health books={books} currency={account.settings.currency} />;
}
