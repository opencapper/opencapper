import {
  DiscordAlert,
  TelegramAlert,
} from "@/components/pages/landing/alert-previews";
import { BooksWall } from "@/components/pages/landing/books-wall";
import { Faq, FinalCta, Pricing } from "@/components/pages/landing/closing";
import { Hero } from "@/components/pages/landing/hero";
import { HowItWorks } from "@/components/pages/landing/how-it-works";
import { loadLanding } from "@/components/pages/landing/landing-data";
import {
  Section,
  SectionHead,
  WRAP,
} from "@/components/pages/landing/landing-ui";
import { Longevity } from "@/components/pages/landing/longevity";
import { NavLive } from "@/components/pages/landing/nav-live";
import { ProofBlock } from "@/components/pages/landing/proof-block";
import { ToolsGrid } from "@/components/pages/landing/tools-grid";
import { Footer } from "@/components/layout/nav/footer";
import { Navbar } from "@/components/layout/nav/navbar";
import { getAccount } from "@/lib/auth/session";
import { matchup } from "@/lib/format";
import { serverLocale } from "@/lib/utils/server";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { connection } from "next/server";

type Props = { params: Promise<{ locale: string }> };

const HABITS = [
  "HABIT_ROUND",
  "HABIT_MIX",
  "HABIT_SPREAD",
  "HABIT_THIN",
  "HABIT_WITHDRAW",
] as const;

export default async function HomePage(props: Props) {
  setRequestLocale(await serverLocale(props));
  await connection();
  const account = await getAccount();
  const data = await loadLanding(account !== undefined);
  const t = await getTranslations("LANDING");
  const tr = await getTranslations();
  const soft = data.books.filter((b) => b.book !== "pinnacle").length;
  const alert = data.alert;

  return (
    <>
      <Navbar
        user={account?.user}
        live={<NavLive list={data.list ?? null} />}
      />
      <main className="bg-background flex-1 pt-14">
        <Hero data={data} />
        <BooksWall books={data.books} now={data.now} />

        <Section id="record" band="ink">
          <div className={WRAP}>
            <SectionHead
              index={1}
              band="ink"
              title={t("PROOF.TITLE")}
              line={t("PROOF.LINE")}
            />
            <ProofBlock stats={data.stats ?? null} results={data.results} />
          </div>
        </Section>

        <HowItWorks detail={data.featured} />

        <Section id="tools">
          <div className={WRAP}>
            <SectionHead
              index={3}
              title={t("TOOLS.TITLE")}
              line={t("TOOLS.LINE")}
            />
            <ToolsGrid
              list={data.list ?? null}
              featured={data.featured ?? null}
              keys={data.boardKeys}
              books={data.books}
              clv={data.clv}
              health={data.health}
            />
          </div>
        </Section>

        <Section id="accounts" band="paper2">
          <div className={WRAP}>
            <SectionHead
              index={4}
              band="paper2"
              title={t("LONGEVITY.TITLE")}
              line={t("LONGEVITY.LINE")}
            />
            <Longevity
              list={data.list ?? null}
              books={data.books}
              form={data.form}
              alertsByBook={data.alertsByBook}
              health={data.health}
            />
            <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center">
              <span className="font-mono text-[11px] tracking-[0.14em] uppercase opacity-70">
                {t("LONGEVITY.HABITS")}
              </span>
              <ul className="flex flex-wrap gap-2">
                {HABITS.map((h, i) => (
                  <li
                    key={h}
                    className="flex items-center gap-2 rounded-full border-[1.5px] border-current py-1.5 pr-4 pl-1.5 text-[14px] font-semibold"
                  >
                    <span className="bg-foreground text-background num grid size-6 place-items-center rounded-full text-[13px] dark:bg-[var(--color-chalk)] dark:text-[var(--color-ink)]">
                      {i + 1}
                    </span>
                    {t(`LONGEVITY.${h}`)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        {alert && (
          <Section id="alerts" band="vermilion">
            <div className={WRAP}>
              <SectionHead
                index={5}
                band="vermilion"
                title={t("ALERTS.TITLE")}
                line={t("ALERTS.LINE")}
              />
              <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div>
                  <DiscordAlert
                    entry={alert}
                    label={t("ALERTS.DISCORD")}
                    now={data.now}
                  />
                  <p className="mt-8 max-w-[600px] font-mono text-[11px] tracking-[0.08em] uppercase">
                    {t("ALERTS.REAL", {
                      fixture: matchup(alert.home, alert.away, tr),
                    })}
                  </p>
                </div>
                <TelegramAlert
                  entry={alert}
                  label={t("ALERTS.TELEGRAM")}
                  botLabel={t("ALERTS.BOT")}
                />
              </div>
            </div>
          </Section>
        )}

        <Pricing books={soft} />
        <Faq books={soft} />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
