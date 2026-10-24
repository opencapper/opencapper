import { AppearanceSettings } from "@/components/pages/navbar/settings/appearance/appearance-settings";
import { buildMetadata, ogImage } from "@/lib/seo/metadata";
import { serverLocale } from "@/lib/utils/server";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const locale = await serverLocale(props);
  const t = await getTranslations({ locale, namespace: "APPEARANCE" });
  return buildMetadata({
    locale,
    href: "/settings/appearance",
    title: t("TITLE"),
    description: t("DESCRIPTION"),
    image: ogImage("home", locale),
    index: false,
  });
}

export default async function AppearancePage(props: Props) {
  setRequestLocale(await serverLocale(props));
  return <AppearanceSettings />;
}
