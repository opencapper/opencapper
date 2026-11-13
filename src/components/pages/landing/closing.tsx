import { Icon } from "@/components/ui/icon";
import { env } from "@/lib/config/env";
import { getTranslations } from "next-intl/server";
import { Cta, Section, SectionHead } from "./landing-ui";

const QUESTIONS = [
  { q: "Q_FREE", a: "A_FREE" },
  { q: "Q_PROFIT", a: "A_PROFIT" },
  { q: "Q_LIMIT", a: "A_LIMIT" },
  { q: "Q_DATA", a: "A_DATA" },
  { q: "Q_FAIR", a: "A_FAIR" },
  { q: "Q_AI", a: "A_AI" },
  { q: "Q_LOSSES", a: "A_LOSSES" },
] as const;

export async function Faq(props: { books: number }) {
  const t = await getTranslations("LANDING.FAQ");
  return (
    <Section id="faq">
      <SectionHead title={t("TITLE")} line={t("LINE")} />
      <dl className="grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2">
        {QUESTIONS.map((item) => (
          <div key={item.q}>
            <dt className="text-sm font-semibold">{t(item.q)}</dt>
            <dd className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
              {t(item.a, { count: String(props.books) })}
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

export async function FinalCta() {
  const t = await getTranslations("LANDING.FINAL");
  return (
    <Section muted>
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-semibold sm:text-3xl">{t("HEADING")}</h2>
          <p className="text-muted-foreground mt-2 text-base">{t("LINE")}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Cta href="/value-bets" tone="primary">
            {t("CTA")}
            <Icon name="arrow-right" className="size-4" />
          </Cta>
          <Cta href={env.discordInviteUrl} external>
            <Icon name="brand-discord" className="size-4" />
            {t("SECONDARY")}
          </Cta>
        </div>
      </div>
    </Section>
  );
}
