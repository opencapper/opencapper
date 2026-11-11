import { ValueBets } from "@/components/pages/navbar/value-bets/value-bets";
import { api, load } from "@/lib/api/client";
import { getAccount } from "@/lib/auth/session";
import { param, planOf } from "@/lib/format";
import { serverLocale } from "@/lib/utils/server";
import { ogMetadata } from "@/lib/og/metadata";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { connection } from "next/server";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const locale = await serverLocale(props);
  const t = await getTranslations({ locale, namespace: "NAV" });
  return { title: t("VALUE_BETS"), ...ogMetadata("VALUE_BETS", locale) };
}

export default async function ValueBetsPage(props: Props) {
  setRequestLocale(await serverLocale(props));
  await connection();
  const sp = await props.searchParams;
  const filters = {
    book: param(sp.book),
    min: param(sp.min),
    market: param(sp.market),
    solid: param(sp.solid),
    mine: param(sp.mine),
  };
  const results = await Promise.all([
    load(
    api.GET("/v1/value-bets", {
      params: {
        query: { book: filters.book, min_ev: filters.min ? Number(filters.min) : undefined, limit: 1000 },
      },
      cache: "no-store",
    }),
    ),
    load(api.GET("/v1/books", { cache: "no-store" })),
    getAccount(),
  ]);
  const account = results[2];
  return (
    <ValueBets
      data={results[0]}
      filters={filters}
      now={Date.now()}
      plan={account ? planOf(account.settings) : undefined}
      preferred={account?.settings.preferred_books ?? []}
      fees={results[1] ?? []}
    />
  );
}
