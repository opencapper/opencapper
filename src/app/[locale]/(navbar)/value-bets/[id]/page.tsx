import { BetDetailView } from "@/components/pages/navbar/value-bets/bet-detail";
import { api, load } from "@/lib/api/client";
import { serverLocale } from "@/lib/utils/server";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { connection } from "next/server";

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: await serverLocale(props), namespace: "BET" });
  return { title: t("META_TITLE") };
}

export default async function BetDetailPage(props: Props) {
  setRequestLocale(await serverLocale(props));
  await connection();
  const id = decodeURIComponent((await props.params).id);
  const data = await load(api.GET("/v1/value-bets/{id}", { params: { path: { id } }, cache: "no-store" }));
  return <BetDetailView data={data} now={Date.now()} />;
}
