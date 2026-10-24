import { APP_VALUES } from "@/lib/config/constants";
import { env } from "@/lib/config/env";
import { buildMetadata, ogImage } from "@/lib/seo/metadata";
import { serverLocale } from "@/lib/utils/server";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export type LegalSlug = "impressum" | "privacy" | "terms";

export type LegalProps = { params: Promise<{ locale: string }> };

export const LEGAL_VALUES = {
  ...APP_VALUES,
  site: new URL(env.appUrl).host,
  email: env.legalEmail,
};

export async function legalMetadata(
  slug: LegalSlug,
  props: LegalProps,
): Promise<Metadata> {
  const locale = await serverLocale(props);
  const t = await getTranslations({ locale, namespace: "LEGAL" });
  const text = {
    impressum: {
      title: t("IMPRESSUM.TITLE"),
      description: t("IMPRESSUM.DESCRIPTION", APP_VALUES),
    },
    privacy: {
      title: t("PRIVACY.TITLE"),
      description: t("PRIVACY.DESCRIPTION", APP_VALUES),
    },
    terms: {
      title: t("TERMS.TITLE"),
      description: t("TERMS.DESCRIPTION", APP_VALUES),
    },
  }[slug];
  return buildMetadata({
    locale,
    href: `/${slug}`,
    ...text,
    image: ogImage("home", locale),
    // Reachable from every footer as the law requires, but not a search result for the owner's name.
    index: slug !== "impressum",
  });
}
