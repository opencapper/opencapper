import { BetDetailView } from "@/components/pages/navbar/value-bets/bet-detail";
import { api, load } from "@/lib/api/client";
import { getAccount } from "@/lib/auth/session";
import { planOf } from "@/lib/format";
import { serverLocale } from "@/lib/utils/server";
import { ogMetadata } from "@/lib/og/metadata";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { connection } from "next/server";

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const locale = await serverLocale(props);
  const t = await getTranslations({ locale, namespace: "BET" });
  const id = decodeURIComponent((await props.params).id);
  return { title: t("META_TITLE"), ...ogMetadata("bet", locale, id) };
}

export default async function BetDetailPage(props: Props) {
  setRequestLocale(await serverLocale(props));
  await connection();
  const id = decodeURIComponent((await props.params).id);
  const results = await Promise.all([
    load(api.GET("/v1/value-bets/{id}", { params: { path: { id } }, cache: "no-store" })),
    load(api.GET("/v1/books", { cache: "no-store" })),
    getAccount(),
  ]);
  const account = results[2];
  return (
    <BetDetailView
      data={results[0]}
      fees={results[1] ?? []}
      plan={account ? planOf(account.settings) : undefined}
      now={Date.now()}
    />
  );
}
