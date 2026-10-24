import { LandingHero } from "@/components/pages/navbar/home/landing-hero";
import { LandingReadme } from "@/components/pages/navbar/home/landing-readme";
import { APP_VALUES } from "@/lib/config/constants";
import { buildMetadata, ogImage } from "@/lib/seo/metadata";
import { serverLocale } from "@/lib/utils/server";
import { getLandingData } from "@/server/landing/landing.service";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const locale = await serverLocale(props);
  const t = await getTranslations({ locale, namespace: "METADATA" });
  return buildMetadata({
    locale,
    href: "/",
    title: t("TITLE", APP_VALUES),
    description: t("DESCRIPTION"),
    image: ogImage("home", locale),
  });
}

export default async function LandingPage(props: Props) {
  setRequestLocale(await serverLocale(props));
  const data = await getLandingData();

  return (
    <div className="relative lg:-mt-12">
      <div className="flex flex-col lg:flex-row lg:items-start">
        <LandingHero />
        <LandingReadme data={data} />
      </div>
    </div>
  );
}
