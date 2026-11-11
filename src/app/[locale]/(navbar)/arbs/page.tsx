import { Arbs } from "@/components/pages/navbar/arbs/arbs";
import { api, load } from "@/lib/api/client";
import { param } from "@/lib/format";
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
  return { title: t("ARBS"), ...ogMetadata("ARBS", locale) };
}

export default async function ArbsPage(props: Props) {
  setRequestLocale(await serverLocale(props));
  await connection();
  const all = !!param((await props.searchParams).all);
  const data = await load(api.GET("/v1/arbs", { params: { query: { include_check: all } }, cache: "no-store" }));
  return <Arbs data={data} all={all} now={Date.now()} />;
}
