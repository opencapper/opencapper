import { Games } from "@/components/pages/navbar/games/games";
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
  return { title: t("ODDS") };
}

export default async function GamesPage(props: Props) {
  setRequestLocale(await serverLocale(props));
  await connection();
  const q = param((await props.searchParams).q);
  const data = await load(api.GET("/v1/games", { params: { query: { q, limit: 400 } }, cache: "no-store" }));
  return <Games data={data} q={q} now={Date.now()} />;
}
