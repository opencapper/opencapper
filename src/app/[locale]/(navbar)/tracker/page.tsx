import { Tracker } from "@/components/pages/navbar/tracker/tracker";
import { serverLocale } from "@/lib/utils/server";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: await serverLocale(props), namespace: "NAV" });
  return { title: t("TRACKER") };
}

export default async function TrackerPage(props: Props) {
  setRequestLocale(await serverLocale(props));
  return <Tracker />;
}
