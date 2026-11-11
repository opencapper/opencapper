import { Overview } from "@/components/pages/navbar/home/overview";
import { api, load } from "@/lib/api/client";
import { serverLocale } from "@/lib/utils/server";
import { setRequestLocale } from "next-intl/server";
import { connection } from "next/server";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage(props: Props) {
  setRequestLocale(await serverLocale(props));
  await connection();
  const results = await Promise.all([
    load(api.GET("/v1/value-bets", { params: { query: { limit: 1000 } }, cache: "no-store" })),
    load(api.GET("/v1/arbs", { params: { query: {} }, cache: "no-store" })),
    load(api.GET("/v1/ledger", { params: { query: { limit: 0 } }, cache: "no-store" })),
    load(api.GET("/v1/books", { cache: "no-store" })),
  ]);
  return (
    <Overview
      bets={results[0]}
      arbs={results[1]}
      ledger={results[2]}
      books={results[3]}
      now={Date.now()}
    />
  );
}
