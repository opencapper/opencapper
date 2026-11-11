import { SectionTitle } from "@/components/elements/page/page-heading";
import { Matchup } from "@/components/elements/participant/matchup";
import { VendorLabel } from "@/components/elements/vendor/vendor-logo";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/i18n/navigation";
import type { IconName } from "@/lib/config/icon-map";
import { msg } from "@/lib/config/constants";
import { count, kickoff, odds, percent, sideName } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getLocale, getTranslations } from "next-intl/server";
import type { LandingLive } from "./landing-data";

const STEPS = [
  msg("LANDING.PROOF.STEP_1"),
  msg("LANDING.PROOF.STEP_2"),
  msg("LANDING.PROOF.STEP_3"),
  msg("LANDING.PROOF.STEP_4"),
];

const TH = "label-mono text-foreground/40 px-4 py-2 text-left text-[9px] font-normal";

export async function ProofSection(props: { live: LandingLive }) {
  const t = await getTranslations();
  const locale = await getLocale();
  const s = props.live.ledger.stats;
  const beat = s.closed > 0 ? s.beat_close / s.closed : undefined;
  const clv = s.avg_clv ?? undefined;

  const points: { icon: IconName; label: string; value: string; hint: string; tone?: string }[] = [
    {
      icon: "shield-check",
      label: t("PROOF.STAT_ALERTS"),
      value: count(s.alerts, locale),
      hint: t("LANDING.PROOF.ALERTS_HINT", { open: count(s.open, locale) }),
    },
    {
      icon: "circle-check",
      label: t("PROOF.STAT_CLOSED"),
      value: count(s.closed, locale),
      hint: t("LANDING.PROOF.CLOSED_HINT"),
    },
    {
      icon: "target",
      label: t("PROOF.STAT_BEAT"),
      value: beat === undefined ? t("FORMAT.NA") : `${Math.round(beat * 100)}%`,
      hint: t("LANDING.PROOF.BEAT_HINT", { beat: count(s.beat_close, locale), closed: count(s.closed, locale) }),
      tone: beat === undefined ? undefined : beat >= 0.5 ? "text-success" : "text-destructive",
    },
    {
      icon: "trending-up",
      label: t("PROOF.STAT_CLV"),
      value: clv === undefined ? t("FORMAT.NA") : percent(clv),
      hint: t("PROOF.CLV_HINT"),
      tone: clv === undefined ? undefined : clv > 0 ? "text-success" : "text-destructive",
    },
  ];

  return (
    <section className="mb-12">
      <SectionTitle>{t("LANDING.PROOF.TITLE")}</SectionTitle>
      <p className="text-foreground/65 mt-3 mb-6 text-sm leading-relaxed sm:text-[15px]">{t("LANDING.PROOF.BODY")}</p>
      <ul className="border-input/80 bg-card mb-4 grid grid-cols-2 overflow-hidden rounded-lg border md:grid-cols-4">
        {points.map((point, i) => (
          <li
            key={point.label}
            className={cn(
              "border-input/80 flex min-w-0 flex-col gap-1.5 p-4",
              i % 2 === 0 && "border-r",
              i < 2 && "border-b md:border-b-0",
              i === 1 && "md:border-r",
              i === 3 && "md:border-r-0",
            )}
          >
            <span className="label-mono text-foreground/50 flex items-center gap-1.5 text-[10px]">
              <Icon name={point.icon} className="size-3.5" />
              {point.label}
            </span>
            <span className={cn("tabular text-2xl font-medium tracking-tight", point.tone ?? "text-foreground/90")}>
              {point.value}
            </span>
            <span className="text-foreground/50 text-[12px] leading-relaxed">{point.hint}</span>
          </li>
        ))}
      </ul>

      {props.live.closed.length > 0 && (
        <div className="border-input/80 bg-card mb-4 min-w-0 overflow-hidden rounded-lg border">
          <div className="bg-muted/50 border-border flex items-center justify-between border-b px-4 py-2">
            <div className="flex items-center gap-1.5">
              <span className="bg-input size-2 rounded-full" />
              <span className="bg-input size-2 rounded-full" />
              <span className="bg-input size-2 rounded-full" />
              <span className="text-foreground/40 ml-2 font-mono text-[10px]">{t("LANDING.PROOF.LATEST")}</span>
            </div>
            <span className="label-mono text-foreground/30 text-[9px]">{t("LANDING.PROOF.LATEST_META")}</span>
          </div>
          <div className="thin-scrollbar overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="border-border border-b">
                <tr>
                  <th className={TH}>{t("PROOF.COL_BET")}</th>
                  <th className={cn(TH, "hidden sm:table-cell")}>{t("PROOF.COL_BOOK")}</th>
                  <th className={cn(TH, "text-right")}>{t("PROOF.COL_ODDS")}</th>
                  <th className={cn(TH, "text-right")}>{t("PROOF.COL_FAIR_CLOSE")}</th>
                  <th className={cn(TH, "text-right")}>{t("PROOF.COL_CLV")}</th>
                </tr>
              </thead>
              <tbody>
                {props.live.closed.map((e) => (
                  <tr key={e.id} className="border-border border-b last:border-b-0">
                    <td className="px-4 py-2.5 align-middle">
                      <div className="text-foreground/90">{sideName(e, t)}</div>
                      <Matchup event={e} size="xs" className="text-foreground/50 mt-0.5 text-[11px]" />
                      <div className="text-foreground/35 mt-0.5 font-mono text-[10px]">{kickoff(e.starts_at, locale)}</div>
                    </td>
                    <td className="text-foreground/70 hidden px-4 py-2.5 align-middle sm:table-cell">
                      <VendorLabel vendorKey={e.book} size={14} />
                    </td>
                    <td className="tabular text-foreground/85 px-4 py-2.5 text-right align-middle">{odds(e.alert_odds)}</td>
                    <td className="tabular text-foreground/60 px-4 py-2.5 text-right align-middle">
                      {e.closing_fair_odds ? odds(e.closing_fair_odds) : t("FORMAT.NA")}
                    </td>
                    <td
                      className={cn(
                        "tabular px-4 py-2.5 text-right align-middle",
                        e.clv === null || e.clv === undefined
                          ? "text-foreground/40"
                          : e.clv > 0
                            ? "text-success"
                            : "text-destructive",
                      )}
                    >
                      {e.clv === null || e.clv === undefined ? t("FORMAT.NA") : percent(e.clv)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Link
        href="/proof"
        className="group label-mono bg-primary text-primary-foreground mb-6 inline-flex items-center gap-1.5 rounded-md px-4 py-2.5 transition-opacity hover:opacity-90"
      >
        {t("LANDING.PROOF.LINK")}
        <Icon name="arrow-right" className="size-3 opacity-70 transition-transform group-hover:translate-x-0.5" />
      </Link>

      <details className="group/details border-input/80 bg-card overflow-hidden rounded-lg border">
        <summary className="label-mono text-foreground/55 hover:text-foreground/85 bg-muted/50 flex cursor-pointer list-none items-center justify-between px-4 py-2.5 text-[10px] transition-colors [&::-webkit-details-marker]:hidden">
          {t("LANDING.PROOF.DETAILS")}
          <Icon name="chevron-down" className="size-3.5 transition-transform group-open/details:rotate-180" />
        </summary>
        <div className="border-input/80 border-t p-4">
          <p className="text-foreground/65 mb-4 text-[13px] leading-relaxed">{t("LANDING.PROOF.DETAILS_BODY")}</p>
          <ol className="border-input/80 grid overflow-hidden rounded-md border sm:grid-cols-2">
            {STEPS.map((step, i) => (
              <li
                key={step}
                className="border-input/80 flex gap-3 border-b p-4 last:border-b-0 sm:odd:border-r sm:[&:nth-child(n+3)]:border-b-0"
              >
                <span className="text-foreground/35 font-mono text-[11px]">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-foreground/70 text-[13px] leading-relaxed">{t(step)}</span>
              </li>
            ))}
          </ol>
        </div>
      </details>
    </section>
  );
}
