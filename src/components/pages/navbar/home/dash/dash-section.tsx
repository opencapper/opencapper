import { SectionTitle } from "@/components/elements/page/page-heading";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/i18n/navigation";
import type { LandingDash } from "@/lib/types";
import { getTranslations } from "next-intl/server";
import { DashFrame } from "./dash-frame";

export async function DashSection(props: { dash: LandingDash | null }) {
  const t = await getTranslations();

  return (
    <section className="mb-12">
      <SectionTitle>{t("LANDING.DASH.TITLE")}</SectionTitle>
      <p className="text-foreground/65 mt-3 mb-6 text-sm leading-relaxed sm:text-[15px]">
        {t("LANDING.DASH.BODY")}
      </p>
      {props.dash ? (
        <>
          <DashFrame dash={props.dash} />
          <p className="text-foreground/40 mt-3 text-[11px] leading-relaxed">
            {t("LANDING.DASH.FOOTNOTE")}
          </p>
        </>
      ) : (
        <div className="border-foreground/10 bg-muted/25 flex flex-col items-start gap-3 rounded-lg border border-dashed px-6 py-8">
          <Icon name="chart-line" className="text-foreground/40 size-5" />
          <span className="text-foreground/85 text-sm font-medium">
            {t("LANDING.DASH.EMPTY_TITLE")}
          </span>
          <span className="text-foreground/55 text-[13px] leading-relaxed">
            {t("LANDING.DASH.EMPTY_BODY")}
          </span>
          <Link
            href="/picks/new"
            className="group label-mono text-foreground/75 hover:text-foreground inline-flex items-center gap-1.5 text-[10px] transition-colors"
          >
            {t("LANDING.CTA.START")}
            <Icon
              name="arrow-right"
              className="size-3 opacity-70 transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      )}
    </section>
  );
}
