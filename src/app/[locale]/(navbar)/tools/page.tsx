import { PageHeading } from "@/components/elements/page/page-heading";
import { PageShell } from "@/components/elements/page/page-shell";
import {
  ArbCalculator,
  DevigCalculator,
  EvCalculator,
  OddsConverter,
} from "@/components/pages/navbar/tools/calculators";
import { serverLocale } from "@/lib/utils/server";
import { ogMetadata } from "@/lib/og/metadata";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const locale = await serverLocale(props);
  const t = await getTranslations({ locale, namespace: "NAV" });
  return { title: t("TOOLS"), ...ogMetadata("TOOLS", locale) };
}

export default async function ToolsPage(props: Props) {
  const locale = await serverLocale(props);
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "TOOLS" });
  return (
    <PageShell>
      <PageHeading className="mb-0" label={t("LABEL")} title={t("HEADING")} description={t("SUBHEADING")} />
      <div className="grid gap-4 md:grid-cols-2">
        <EvCalculator />
        <DevigCalculator />
        <ArbCalculator />
        <OddsConverter />
      </div>
    </PageShell>
  );
}
