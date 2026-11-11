import { Books } from "@/components/pages/navbar/books/books";
import { api, load } from "@/lib/api/client";
import { serverLocale } from "@/lib/utils/server";
import { ogMetadata } from "@/lib/og/metadata";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { connection } from "next/server";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const locale = await serverLocale(props);
  const t = await getTranslations({ locale, namespace: "NAV" });
  return { title: t("BOOKS"), ...ogMetadata("BOOKS", locale) };
}

export default async function BooksPage(props: Props) {
  setRequestLocale(await serverLocale(props));
  await connection();
  const data = await load(api.GET("/v1/books", { cache: "no-store" }));
  return <Books data={data} now={Date.now()} />;
}
