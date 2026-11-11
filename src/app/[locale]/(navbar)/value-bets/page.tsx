import { ValueBets } from "@/components/pages/navbar/value-bets/value-bets";
import { api, load } from "@/lib/api/client";
import { param } from "@/lib/format";
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
  return { title: t("VALUE_BETS") };
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
  };
  const data = await load(
    api.GET("/v1/value-bets", {
      params: {
        query: { book: filters.book, min_ev: filters.min ? Number(filters.min) : undefined, limit: 1000 },
      },
      cache: "no-store",
    }),
  );
  return <ValueBets data={data} filters={filters} now={Date.now()} />;
}
