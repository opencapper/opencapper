import {
  DiscordAlert,
  TelegramAlert,
} from "@/components/pages/landing/alert-previews";
import { BooksWall } from "@/components/pages/landing/books-wall";
import { Faq, FinalCta } from "@/components/pages/landing/closing";
import { Hero } from "@/components/pages/landing/hero";
import { HowItWorks } from "@/components/pages/landing/how-it-works";
import { loadLanding } from "@/components/pages/landing/landing-data";
import { Section, SectionHead } from "@/components/pages/landing/landing-ui";
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

export default async function HomePage(props: Props) {
  setRequestLocale(await serverLocale(props));
  await connection();
  const results = await Promise.all([getAccount(), loadLanding()]);
  const account = results[0];
  const data = results[1];
  const t = await getTranslations("LANDING");
  const tr = await getTranslations();
  const soft = data.books.filter((b) => b.book !== "pinnacle").length;
  const alert = data.alert;

  return (
    <>
      <Navbar
        user={account?.user}
        live={<NavLive list={data.list ?? null} edges={data.edges} />}
      />
      <main className="bg-background flex-1 pt-14">
        <Hero data={data} books={soft} />
        <BooksWall books={data.books} now={data.now} />

        <Section id="record" muted>
          <SectionHead title={t("PROOF.HEADING")} line={t("PROOF.SUB")} />
          <ProofBlock stats={data.stats ?? null} results={data.results} />
        </Section>

        <HowItWorks detail={data.featured} />

        <Section id="tools" muted>
          <SectionHead title={t("TOOLS.HEADING")} line={t("TOOLS.SUB")} />
          <ToolsGrid edges={data.edges} books={soft} />
        </Section>

        <Section id="accounts">
          <SectionHead title={t("LONGEVITY.HEADING")} line={t("LONGEVITY.LINE")} />
          <Longevity books={data.books} alertsByBook={data.alertsByBook} />
        </Section>

        {alert && (
          <Section id="alerts" muted>
            <SectionHead title={t("ALERTS.HEADING")} line={t("ALERTS.LINE")} />
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="flex flex-col gap-3">
                <DiscordAlert
                  entry={alert}
                  label={t("ALERTS.DISCORD")}
                  now={data.now}
                />
                <p className="text-muted-foreground text-xs">
                  {t("ALERTS.REAL", { fixture: matchup(alert.home, alert.away, tr) })}
                </p>
              </div>
              <TelegramAlert
                entry={alert}
                label={t("ALERTS.TELEGRAM")}
                botLabel={t("ALERTS.BOT")}
              />
            </div>
          </Section>
        )}

        <Faq books={soft} />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
