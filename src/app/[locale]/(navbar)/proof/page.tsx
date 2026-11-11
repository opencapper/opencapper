import { Proof } from "@/components/pages/navbar/proof/proof";
import { api, load } from "@/lib/api/client";
import { serverLocale } from "@/lib/utils/server";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { connection } from "next/server";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: await serverLocale(props), namespace: "NAV" });
  return { title: t("PROOF") };
}

export default async function ProofPage(props: Props) {
  setRequestLocale(await serverLocale(props));
  await connection();
  const data = await load(api.GET("/v1/ledger", { params: { query: { limit: 500 } }, cache: "no-store" }));
  return <Proof data={data} />;
}
