import { SectionTitle } from "@/components/elements/page/page-heading";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/i18n/navigation";
import { env } from "@/lib/config/env";
import type { LandingData } from "@/lib/types";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { FeatureGrid } from "./feature-grid";
import { IntegrationsGrid } from "./integrations-grid";
import { IntegrationsShowcase } from "./integrations-showcase";
import { SportsMarquee } from "./sports-marquee";
import { VerifySection } from "./verify-section";

const strong = (chunks: ReactNode) => (
  <span className="text-foreground/95 font-medium">{chunks}</span>
);

export async function LandingReadme(props: { data: LandingData }) {
  const t = await getTranslations("LANDING");

  return (
    <article className="animate-fade-in relative z-0 w-full min-w-0 px-5 pt-10 pb-16 sm:px-6 lg:w-[60%] lg:px-8 lg:pt-20">
      <h2 className="text-foreground mb-4 flex items-center gap-3 font-mono text-sm sm:mb-5 sm:text-[15px]">
        {t("README")}
        <span aria-hidden className="bg-input h-px flex-1" />
      </h2>

      <p className="text-foreground/75 mb-6 text-sm leading-relaxed sm:mb-8 sm:text-[15px]">
        {t.rich("INTRO", { b: strong })}
      </p>

      <IntegrationsShowcase
        featured={props.data.featured}
        username={props.data.stats?.top[0]?.username ?? "username"}
      />
      <SportsMarquee />
      <IntegrationsGrid />

      <div className="mb-4">
        <SectionTitle>{t("FEATURES.TITLE")}</SectionTitle>
      </div>
      <FeatureGrid data={props.data} />

      <VerifySection latest={props.data.stats?.latest ?? null} />

      <div className="border-input bg-muted/25 flex flex-col gap-4 rounded-lg border border-dashed px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-foreground/90 text-sm font-medium">
            {t("CTA.TITLE")}
          </span>
          <span className="text-foreground/60 text-xs">{t("CTA.BODY")}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <a
            href={env.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="label-mono text-foreground/60 hover:text-foreground/90 hover:bg-muted rounded-md px-3 py-2.5 transition-colors"
          >
            {t("CTA.SOURCE")}
          </a>
          <Link
            href="/picks/new"
            className="group label-mono bg-primary text-primary-foreground inline-flex items-center gap-1.5 rounded-md px-4 py-2.5 transition-opacity hover:opacity-90"
          >
            {t("CTA.START")}
            <Icon
              name="arrow-right"
              className="size-3 opacity-70 transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </article>
  );
}
