import { AppearanceSettings } from "@/components/pages/navbar/settings/appearance/appearance-settings";
import { serverLocale } from "@/lib/utils/server";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const locale = await serverLocale(props);
  const t = await getTranslations({ locale, namespace: "APPEARANCE" });
  return { title: t("TITLE"), description: t("DESCRIPTION") };
}

export default async function AppearancePage(props: Props) {
  setRequestLocale(await serverLocale(props));
  return <AppearanceSettings />;
}
