import { SectionTitle } from "@/components/elements/page/page-heading";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/i18n/navigation";
import { msg } from "@/lib/config/constants";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { BooksMarquee } from "./books-marquee";
import { CheckSection } from "./check-section";
import { DashSection } from "./dash/dash-section";
import { FeatureGrid } from "./feature-grid";
import { CoverageGrid, ToolsGrid } from "./integrations-grid";
import type { LandingData } from "./landing-data";
import { LiveShowcase } from "./live-landing";
import { ProofSection } from "./proof-section";

const strong = (chunks: ReactNode) => <span className="text-foreground/95 font-medium">{chunks}</span>;

const STEPS = [
  { title: msg("LANDING.STEPS.STEP_1_TITLE"), body: msg("LANDING.STEPS.STEP_1_BODY") },
  { title: msg("LANDING.STEPS.STEP_2_TITLE"), body: msg("LANDING.STEPS.STEP_2_BODY") },
  { title: msg("LANDING.STEPS.STEP_3_TITLE"), body: msg("LANDING.STEPS.STEP_3_BODY") },
];

async function Steps() {
  const t = await getTranslations();
  return (
    <section className="mb-12">
      <SectionTitle>{t("LANDING.STEPS.TITLE")}</SectionTitle>
      <ol className="border-input/80 bg-card mt-6 grid overflow-hidden rounded-lg border md:grid-cols-3">
        {STEPS.map((step, i) => (
          <li
            key={step.title}
            className="border-input/80 flex flex-col gap-2 border-b p-4 last:border-b-0 md:border-r md:border-b-0 md:last:border-r-0 lg:p-5"
          >
            <span className="text-foreground/35 font-mono text-[11px] tracking-wider">{String(i + 1).padStart(2, "0")}</span>
            <span className="text-foreground/90 text-[13px] font-medium">{t(step.title)}</span>
            <span className="text-foreground/55 text-[13px] leading-relaxed">{t(step.body)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export async function LandingReadme(props: { data: LandingData }) {
  const t = await getTranslations("LANDING");
  const live = props.data.live;
  const signedIn = props.data.signedIn;

  return (
    <article className="animate-fade-in relative z-0 w-full min-w-0 px-5 pt-10 pb-16 sm:px-6 lg:w-[60%] lg:px-8 lg:pt-20">
      <h2 className="text-foreground mb-4 flex items-center gap-3 font-mono text-sm sm:mb-5 sm:text-[15px]">
        {t("README")}
        <span aria-hidden className="bg-input h-px flex-1" />
      </h2>

      <p className="text-foreground/75 mb-6 text-sm leading-relaxed sm:mb-8 sm:text-[15px]">
        {live ? t.rich("INTRO", { b: strong, books: String(live.soft.length) }) : t.rich("INTRO_OFFLINE", { b: strong })}
      </p>

      {live && (
        <>
          <LiveShowcase list={live.list} keys={live.featured.map((g) => g.key)} books={live.books} />
          <BooksMarquee books={live.books} soft={live.soft.length} />
          <DashSection live={live} now={props.data.now} />
          <div className="mb-4">
            <SectionTitle>{t("FEATURES.TITLE")}</SectionTitle>
            <p className="text-foreground/65 mt-3 text-sm leading-relaxed sm:text-[15px]">{t("FEATURES.BODY")}</p>
          </div>
          <FeatureGrid live={live} />
        </>
      )}

      <ToolsGrid />

      {live && (
        <>
          <ProofSection live={live} />
          <CoverageGrid books={live.books} now={props.data.now} />
        </>
      )}

      <Steps />
      <CheckSection />

      <div className="border-input bg-muted/25 flex flex-col gap-4 rounded-lg border border-dashed px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-foreground/90 text-sm font-medium">{t("CTA.TITLE")}</span>
          <span className="text-foreground/60 text-xs">{signedIn ? t("CTA.BODY_SIGNED_IN") : t("CTA.BODY")}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={signedIn ? "/tracker" : "/proof"}
            className="label-mono text-foreground/60 hover:text-foreground/90 hover:bg-muted rounded-md px-3 py-2.5 transition-colors"
          >
            {signedIn ? t("CTA_TRACKER") : t("CTA_PROOF")}
          </Link>
          <Link
            href={signedIn ? "/value-bets" : "/sign-in"}
            className="group label-mono bg-primary text-primary-foreground inline-flex items-center gap-1.5 rounded-md px-4 py-2.5 transition-opacity hover:opacity-90"
          >
            {signedIn ? t("CTA_VALUE_BETS") : t("CTA_REGISTER")}
            <Icon name="arrow-right" className="size-3 opacity-70 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
      <p className="text-foreground/40 mt-4 text-[11px] leading-relaxed">{t("RESPONSIBLE")}</p>
    </article>
  );
}
