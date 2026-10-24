import { Icon } from "@/components/ui/icon";
import { Link } from "@/i18n/navigation";
import { env } from "@/lib/config/env";
import { getTranslations } from "next-intl/server";
import { CapperMark } from "./capper-mark";
import { LineFieldBackground } from "./line-field-bg";

const DIAGONAL =
  "repeating-linear-gradient(-45deg, transparent, transparent 4px, currentColor 4px, currentColor 5px)";

export async function LandingHero() {
  const t = await getTranslations("LANDING");

  return (
    <section className="bg-background border-border relative z-10 w-full border-b px-5 sm:px-6 lg:sticky lg:top-0 lg:h-dvh lg:w-[40%] lg:shrink-0 lg:overflow-clip lg:border-r lg:border-b-0 lg:px-7">
      <LineFieldBackground />
      <div
        data-line-field-clear
        className="animate-mark-reveal pointer-events-none absolute inset-0 z-1 hidden items-center justify-center lg:flex"
      >
        <CapperMark className="pointer-events-auto -mt-[78%] w-full max-w-[400px]" />
      </div>

      <div className="animate-fade-in pointer-events-none relative z-2 flex h-full w-full flex-col justify-center py-16 lg:py-0">
        <div className="pointer-events-auto">
          <a
            href={env.discordInviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group/badge bg-input/80 hover:bg-input relative inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 backdrop-blur-sm transition-colors"
          >
            <Icon name="brand-discord" className="size-3.5 text-[#5865F2]" />
            <span className="text-foreground/70 text-xs font-light sm:text-sm">
              {t("ANNOUNCEMENT_LABEL")}{" "}
              <span className="text-foreground/90 font-medium">
                | {t("ANNOUNCEMENT")}
              </span>
            </span>
            <Icon
              name="arrow-right"
              className="text-foreground/50 size-3.5 transition-transform group-hover/badge:translate-x-0.5"
            />
          </a>

          <h1 className="text-foreground/90 pt-4 text-3xl leading-tight font-normal tracking-tight text-balance xl:text-4xl">
            {t("HEADLINE")}
          </h1>
          <p className="text-foreground/55 mt-3 max-w-md text-sm leading-relaxed sm:text-[15px]">
            {t("SUBHEADLINE")}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-6">
            <Link
              href="/picks/new"
              className="bg-primary text-primary-foreground focus-visible:ring-ring/50 inline-flex items-center gap-1.5 rounded-md px-5 py-2 text-sm font-medium transition-opacity outline-none hover:opacity-90 focus-visible:ring-3"
            >
              {t("CTA_TRACK")}
            </Link>
            <Link
              href="/leaderboard"
              className="group text-foreground/75 focus-visible:ring-ring/50 relative inline-flex items-center gap-1.5 rounded-md px-5 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-3"
            >
              <span
                aria-hidden
                className="absolute inset-0 rounded-md opacity-[0.04] transition-opacity group-hover:opacity-[0.08]"
                style={{ backgroundImage: DIAGONAL }}
              />
              <span className="bg-input group-hover:bg-ring/60 absolute top-0 -right-1.5 -left-1.5 h-px transition-colors" />
              <span className="bg-input group-hover:bg-ring/60 absolute -right-1.5 bottom-0 -left-1.5 h-px transition-colors" />
              <span className="bg-input group-hover:bg-ring/60 absolute -top-1.5 -bottom-1.5 left-0 w-px transition-colors" />
              <span className="bg-input group-hover:bg-ring/60 absolute -top-1.5 right-0 -bottom-1.5 w-px transition-colors" />
              <span
                aria-hidden
                className="text-foreground/45 absolute -right-1.5 -bottom-1.5 translate-x-1/2 translate-y-1/2 font-mono text-[8px] leading-none select-none"
              >
                +
              </span>
              <span className="relative">{t("CTA_LEADERBOARD")}</span>
            </Link>
          </div>
        </div>
      </div>

      <p className="label-mono text-foreground/35 absolute right-7 bottom-5 left-7 z-3 hidden text-[10px] lg:block">
        {t("HERO_FOOTNOTE")}
      </p>
    </section>
  );
}
