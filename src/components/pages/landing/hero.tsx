import { day } from "@/lib/format";
import { getLocale, getTranslations } from "next-intl/server";
import type { LandingData } from "./landing-data";
import { Arrow, Pill, WRAP } from "./landing-ui";
import { LiveBoard } from "./live-board";
import { HeroCounters } from "./nav-live";

function Pitch() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 760 500"
      className="absolute -top-10 -right-48 z-0 w-[540px] rotate-[-8deg] sm:-top-16 sm:-right-44 sm:w-[760px]"
    >
      <rect width="760" height="500" rx="20" className="fill-pitch" />
      <g className="fill-pitch-2">
        <rect x="0" width="76" height="500" />
        <rect x="152" width="76" height="500" />
        <rect x="304" width="76" height="500" />
        <rect x="456" width="76" height="500" />
        <rect x="608" width="76" height="500" />
      </g>
      <g fill="none" stroke="#f7f3ea" strokeOpacity=".55" strokeWidth="3">
        <rect x="20" y="20" width="720" height="460" />
        <path d="M380 20V480" />
        <circle cx="380" cy="250" r="70" />
        <rect x="20" y="130" width="110" height="240" />
        <rect x="630" y="130" width="110" height="240" />
      </g>
    </svg>
  );
}

export async function Hero(props: { data: LandingData }) {
  const t = await getTranslations("LANDING");
  const locale = await getLocale();
  const data = props.data;
  const soft = data.books.filter((b) => b.book !== "pinnacle").length;

  return (
    <header className="relative overflow-hidden">
      <div className="border-foreground bg-background relative z-[2] border-b">
        <div
          className={`${WRAP} flex h-9 items-center justify-between gap-4 font-mono text-[11px] tracking-[0.08em] uppercase sm:text-[12px]`}
        >
          <span suppressHydrationWarning>
            {t("ISSUE", {
              date: day(new Date(data.now).toISOString(), locale),
            })}
          </span>
          {soft > 0 && (
            <span className="hidden md:inline">
              {t("ISSUE_BOOKS", { count: String(soft) })}
            </span>
          )}
          <span className="hidden sm:inline">{t("ISSUE_FREE")}</span>
        </div>
      </div>

      <div
        className={`${WRAP} grid grid-cols-1 gap-12 pt-14 pb-20 sm:pt-16 lg:grid-cols-[1fr_1.08fr] lg:gap-12 lg:pb-24`}
      >
        <div className="relative z-[1]">
          <h1 className="headline text-[78px] leading-[0.84] sm:text-[clamp(96px,10.4vw,164px)]">
            {t("HERO.TITLE_A")}
            <span className="serif-accent text-vermilion my-2 block text-[0.62em] leading-none sm:my-3">
              {t("HERO.TITLE_B")}
            </span>
            {t("HERO.TITLE_C")}
          </h1>
          <p className="text-foreground/80 mt-6 max-w-[520px] font-serif text-[24px] leading-[1.15] sm:mt-7 sm:text-[30px]">
            {t.rich("HERO.LINE", {
              em: (chunks) => <em className="text-foreground">{chunks}</em>,
            })}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Pill href="/value-bets" tone="vermilion">
              {t("HERO.CTA")}
              <Arrow />
            </Pill>
            <Pill href="/proof">{t("HERO.SECONDARY")}</Pill>
          </div>
          <p className="text-foreground/60 mt-4 font-mono text-[12px] tracking-[0.08em] uppercase">
            {t("HERO.CTA_NOTE")}
          </p>
          <HeroCounters list={data.list ?? null} books={soft} />
        </div>

        <div className="relative pt-4 lg:pt-5">
          <Pitch />
          <LiveBoard
            list={data.list ?? null}
            keys={data.boardKeys}
            featured={data.featured ?? null}
            now={data.now}
          />
        </div>
      </div>
    </header>
  );
}
