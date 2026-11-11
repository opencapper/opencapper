import { SignInPrompt } from "@/components/elements/account/sign-in-prompt";
import { isBetStatus } from "@/components/pages/navbar/tracker/bet-status";
import { Tracker, TrackerShell } from "@/components/pages/navbar/tracker/tracker";
import { api, load } from "@/lib/api/client";
import { authHeaders, getAccount } from "@/lib/auth/session";
import { param, query } from "@/lib/format";
import { serverLocale } from "@/lib/utils/server";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { connection } from "next/server";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: await serverLocale(props), namespace: "NAV" });
  return { title: t("TRACKER") };
}

export default async function TrackerPage(props: Props) {
  setRequestLocale(await serverLocale(props));
  await connection();
  const raw = param((await props.searchParams).status);
  const status = isBetStatus(raw) ? raw : undefined;
  const account = await getAccount();
  const headers = await authHeaders();
  if (!account || !headers) {
    return (
      <TrackerShell active="/tracker">
        <SignInPrompt next={query("/tracker", { status })} />
      </TrackerShell>
    );
  }
  const results = await Promise.all([
    load(api.GET("/v1/bets/stats", { headers, cache: "no-store" })),
    load(api.GET("/v1/bets", { headers, params: { query: { status, limit: 500 } }, cache: "no-store" })),
    load(api.GET("/v1/books", { cache: "no-store" })),
  ]);
  const books = (results[2] ?? []).map((b) => b.book).filter((b) => b !== "pinnacle");
  return (
    <Tracker
      stats={results[0]}
      bets={results[1]}
      books={books}
      status={status}
      currency={account.settings.currency}
    />
  );
}
