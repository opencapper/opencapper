import { LogoImage } from "@/components/elements/brand/brand";
import { env } from "@/lib/config/env";
import { getTranslations } from "next-intl/server";
import { Arrow, Pill, Section, SectionHead, WRAP } from "./landing-ui";

function Check() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="text-pitch mt-1 size-4 shrink-0 dark:text-[#3fae74]"
    >
      <path
        d="M2.5 8.5l3.5 3.5 7.5-8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
      />
    </svg>
  );
}

export async function Pricing(props: { books: number }) {
  const t = await getTranslations("LANDING.PRICING");
  const features = [
    t("F_BOARD"),
    t("F_ODDS", { count: String(props.books) }),
    t("F_RECORD"),
    t("F_TRACKER"),
    t("F_ALERTS"),
  ];
  return (
    <Section id="pricing">
      <div className={WRAP}>
        <SectionHead index={6} title={t("TITLE")} line={t("LINE")} />
        {/* A match ticket: the stub carries the price, a perforation, then what it gets you. */}
        <div className="border-foreground bg-card relative mx-auto grid max-w-[1040px] grid-cols-1 overflow-hidden rounded-[22px] border-2 md:grid-cols-[340px_1fr]">
          <div className="bg-foreground text-background relative flex flex-col justify-between gap-6 p-7 sm:p-9">
            <div>
              <span className="font-mono text-[11px] tracking-[0.14em] uppercase opacity-70">
                {t("PLAN")}
              </span>
              <p className="headline mt-2 text-[96px] leading-[0.85] sm:text-[120px]">
                {t("PRICE")}
              </p>
              <p className="mt-3 font-serif text-[22px] leading-tight italic opacity-85">
                {t("PRICE_NOTE")}
              </p>
            </div>
            <LogoImage className="text-background size-14" />
            <span
              aria-hidden
              className="bg-background absolute -right-4 -bottom-4 hidden size-8 rounded-full md:block"
            />
            <span
              aria-hidden
              className="bg-background absolute -top-4 -right-4 hidden size-8 rounded-full md:block"
            />
          </div>
          <div className="flex flex-col gap-6 border-dashed p-7 sm:p-9 md:border-l-2 md:border-l-[var(--color-foreground)]">
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {features.map((f) => (
                <li key={f} className="flex gap-2.5 text-[16px] font-semibold">
                  <Check />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-auto flex flex-col gap-4">
              <div>
                <Pill href="/value-bets" tone="vermilion">
                  {t("CTA")}
                  <Arrow />
                </Pill>
              </div>
              <p className="text-foreground/70 font-mono text-[12px] tracking-[0.06em] uppercase">
                {t("RISK")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

export async function Faq(props: { books: number }) {
  const t = await getTranslations("LANDING.FAQ");
  const items = [
    { q: t("Q_PROFIT"), a: t("A_PROFIT") },
    { q: t("Q_LIMIT"), a: t("A_LIMIT") },
    { q: t("Q_DATA"), a: t("A_DATA", { count: String(props.books) }) },
    { q: t("Q_FAIR"), a: t("A_FAIR") },
    { q: t("Q_LOSSES"), a: t("A_LOSSES") },
  ];
  return (
    <Section id="faq" band="paper2">
      <div
        className={`${WRAP} grid grid-cols-1 gap-x-14 lg:grid-cols-[0.9fr_1.1fr]`}
      >
        <div className="lg:sticky lg:top-24 lg:self-start">
          <SectionHead
            index={7}
            band="paper2"
            stacked
            title={t("TITLE")}
            line={t("LINE")}
          />
        </div>
        <div className="border-foreground border-t-[3px] dark:border-[var(--color-chalk)]">
          {items.map((item, i) => (
            <details
              key={item.q}
              open={i === 0}
              className="group border-b border-current/20 py-5"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 [&::-webkit-details-marker]:hidden">
                <span className="headline text-[26px] leading-[1] sm:text-[32px]">
                  {item.q}
                </span>
                <span
                  aria-hidden
                  className="bg-vermilion text-ink num mt-1 grid size-8 shrink-0 place-items-center rounded-full text-[22px] leading-none transition-transform group-open:rotate-45 motion-reduce:transition-none"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-[640px] font-serif text-[21px] leading-snug italic">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </Section>
  );
}

export async function FinalCta() {
  const t = await getTranslations("LANDING.FINAL");
  return (
    <section className="bg-band text-chalk border-chalk/10 border-b py-24 text-center sm:py-32">
      <div className={WRAP}>
        <LogoImage className="text-chalk mx-auto mb-8 size-24 sm:size-28" />
        <h2 className="headline text-[64px] leading-[0.84] sm:text-[clamp(88px,11vw,184px)]">
          {t("TITLE_A")}
          <span className="serif-accent text-vermilion block text-[0.7em] leading-[1.05]">
            {t("TITLE_B")}
          </span>
        </h2>
        <p className="text-chalk/75 mx-auto mt-6 max-w-xl font-serif text-[22px] italic sm:text-[26px]">
          {t("LINE")}
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Pill href="/value-bets" tone="vermilion">
            {t("CTA")}
            <Arrow />
          </Pill>
          <Pill href={env.discordInviteUrl} external className="text-chalk">
            {t("SECONDARY")}
          </Pill>
        </div>
      </div>
    </section>
  );
}
